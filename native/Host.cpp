// The x64 host links ooz and loads the embedded Windows Forms assembly in memory.
#include <windows.h>
#include <oleauto.h>
#include <mscoree.h>
#include <cstdint>
#include <string>
#include <vector>
#include <cstring>
#include "ooz.h"

extern "C" __declspec(dllexport) int PBZ_Decompress(const unsigned char* source, int length, unsigned char* output, int size)
{
    if (!source || !output || length < 2 || length > 64 * 1024 * 1024 || size <= 0 || size > 64 * 1024 * 1024) return -1;
    try {
        // ooz uses SIMD loads/stores with a documented 64-byte guard.
        std::vector<unsigned char> input(length + OOZ_SAFE_SPACE);
        std::vector<unsigned char> decoded(size + OOZ_SAFE_SPACE);
        std::memcpy(input.data(), source, length);
        int written = Kraken_Decompress(input.data(), length, decoded.data(), size);
        if (written == size) std::memcpy(output, decoded.data(), size);
        return written;
    } catch (...) { return -1; }
}

template<class T> struct Com {
    T* pointer = nullptr;
    ~Com() { if (pointer) pointer->Release(); }
    T* operator->() const { return pointer; }
    T** out() { return &pointer; }
};

static void Check(HRESULT result, const wchar_t* operation)
{
    if (FAILED(result)) {
        wchar_t code[16];
        wsprintfW(code, L"0x%08X", static_cast<unsigned int>(result));
        throw std::wstring(operation) + L" (" + code + L")";
    }
}

static void* ClrMethod(ITypeLib* library, IUnknown* object, const wchar_t* type, const wchar_t* method, Com<IUnknown>& target)
{
    for (UINT i = 0; i < library->GetTypeInfoCount(); ++i) {
        BSTR name = nullptr;
        Check(library->GetDocumentation(i, &name, nullptr, nullptr, nullptr), L"读取 CLR 接口名");
        bool match = name && wcscmp(name, type) == 0;
        SysFreeString(name);
        if (!match) continue;
        Com<ITypeInfo> info;
        Check(library->GetTypeInfo(i, info.out()), L"读取 CLR 接口");
        TYPEATTR* attr = nullptr;
        Check(info->GetTypeAttr(&attr), L"读取 CLR 类型属性");
        GUID iid = attr->guid;
        WORD functions = attr->cFuncs;
        info->ReleaseTypeAttr(attr);
        Check(object->QueryInterface(iid, reinterpret_cast<void**>(target.out())), L"查询 CLR 接口");
        for (WORD f = 0; f < functions; ++f) {
            FUNCDESC* desc = nullptr;
            Check(info->GetFuncDesc(f, &desc), L"读取 CLR 方法");
            MEMBERID id = desc->memid;
            SHORT offset = desc->oVft;
            info->ReleaseFuncDesc(desc);
            BSTR member = nullptr;
            Check(info->GetDocumentation(id, &member, nullptr, nullptr, nullptr), L"读取 CLR 方法名");
            bool same = member && wcscmp(member, method) == 0;
            SysFreeString(member);
            if (same) return *reinterpret_cast<void**>(*reinterpret_cast<unsigned char**>(target.pointer) + offset);
        }
    }
    throw std::wstring(L"系统 CLR 接口缺少方法 ") + method;
}

static int Run(HINSTANCE instance)
{
    const GUID clsid = {0xcb2f6723, 0xab3a, 0x11d2, {0x9c,0x40,0x00,0xc0,0x4f,0xa3,0x0a,0x3e}};
    const GUID iid = {0xcb2f6722, 0xab3a, 0x11d2, {0x9c,0x40,0x00,0xc0,0x4f,0xa3,0x0a,0x3e}};
    HMODULE shim = LoadLibraryExW(L"mscoree.dll", nullptr, LOAD_LIBRARY_SEARCH_SYSTEM32);
    if (!shim) throw std::wstring(L"无法加载 Windows .NET Framework 4。");
    using Bind = HRESULT (WINAPI*)(LPCWSTR, LPCWSTR, DWORD, REFCLSID, REFIID, LPVOID*);
    auto bind = reinterpret_cast<Bind>(GetProcAddress(shim, "CorBindToRuntimeEx"));
    if (!bind) throw std::wstring(L"无法启动 Windows .NET Framework 4。");
    Com<ICorRuntimeHost> clr;
    Check(bind(L"v4.0.30319", L"wks", 0, clsid, iid, reinterpret_cast<void**>(clr.out())), L"启动系统 CLR");
    Check(clr->Start(), L"启动 Windows .NET Framework");
    Com<IUnknown> domain;
    Check(clr->GetDefaultDomain(domain.out()), L"获取默认应用域");

    wchar_t directory[MAX_PATH];
    UINT length = GetWindowsDirectoryW(directory, MAX_PATH);
    if (length == 0 || length >= MAX_PATH) throw std::wstring(L"无法定位 Windows 目录。");
    std::wstring typelib = std::wstring(directory) + L"\\Microsoft.NET\\Framework64\\v4.0.30319\\mscorlib.tlb";
    Com<ITypeLib> library;
    Check(LoadTypeLibEx(typelib.c_str(), REGKIND_NONE, library.out()), L"读取系统 CLR 类型库");

    HRSRC resource = FindResourceW(instance, MAKEINTRESOURCEW(101), MAKEINTRESOURCEW(10));
    DWORD size = resource ? SizeofResource(instance, resource) : 0;
    HGLOBAL loaded = resource ? LoadResource(instance, resource) : nullptr;
    const void* bytes = loaded ? LockResource(loaded) : nullptr;
    if (!bytes || size == 0) throw std::wstring(L"程序资源不完整。");

    Com<IUnknown> appDomain, assembly, assemblyInterface;
    using Load = HRESULT (STDMETHODCALLTYPE*)(IUnknown*, SAFEARRAY*, IUnknown**);
    auto load = reinterpret_cast<Load>(ClrMethod(library.pointer, domain.pointer, L"_AppDomain", L"Load_3", appDomain));
    SAFEARRAY* array = SafeArrayCreateVector(VT_UI1, 0, size);
    if (!array) throw std::wstring(L"无法分配程序资源。");
    std::memcpy(array->pvData, bytes, size);
    HRESULT result = load(appDomain.pointer, array, assembly.out());
    SafeArrayDestroy(array);
    Check(result, L"加载内置应用");

    using Create = HRESULT (STDMETHODCALLTYPE*)(IUnknown*, BSTR, VARIANT*);
    auto create = reinterpret_cast<Create>(ClrMethod(library.pointer, assembly.pointer, L"_Assembly", L"CreateInstance", assemblyInterface));
    BSTR name = SysAllocString(L"PBZ.Native.Entry");
    VARIANT entry;
    VariantInit(&entry);
    result = create(assemblyInterface.pointer, name, &entry);
    SysFreeString(name);
    Check(result, L"创建原生窗口入口");
    Com<IDispatch> dispatch;
    const GUID dispatchId = {0x00020400, 0, 0, {0xc0,0,0,0,0,0,0,0x46}};
    IUnknown* unknown = entry.vt == VT_UNKNOWN ? entry.punkVal : entry.vt == VT_DISPATCH ? entry.pdispVal : nullptr;
    if (unknown) result = unknown->QueryInterface(dispatchId, reinterpret_cast<void**>(dispatch.out()));
    VariantClear(&entry);
    Check(result, L"查询窗口入口");
    if (!dispatch.pointer) throw std::wstring(L"应用入口缺失。");

    wchar_t runName[] = L"Run";
    LPOLESTR names[] = { runName };
    const GUID nil = {};
    DISPID method;
    Check(dispatch->GetIDsOfNames(nil, names, 1, LOCALE_USER_DEFAULT, &method), L"查找启动方法");
    DISPPARAMS args = {};
    VARIANT response;
    VariantInit(&response);
    result = dispatch->Invoke(method, nil, LOCALE_USER_DEFAULT, DISPATCH_METHOD, &args, &response, nullptr, nullptr);
    int code = response.vt == VT_I4 ? response.lVal : 0;
    VariantClear(&response);
    Check(result, L"运行原生应用");
    return code;
}

int WINAPI wWinMain(HINSTANCE instance, HINSTANCE, PWSTR, int)
{
    HRESULT initialized = CoInitializeEx(nullptr, COINIT_APARTMENTTHREADED);
    int result = 1;
    try {
        Check(initialized, L"初始化 Windows 窗口线程");
        result = Run(instance);
    } catch (const std::wstring& error) {
        OutputDebugStringW(error.c_str());
        DWORD written;
        if (AttachConsole(ATTACH_PARENT_PROCESS))
            WriteConsoleW(GetStdHandle(STD_ERROR_HANDLE), error.c_str(), static_cast<DWORD>(error.size()), &written, nullptr);
        if (!wcsstr(GetCommandLineW(), L"--diagnose")) MessageBoxW(nullptr, error.c_str(), L"影之刃零 · 行前检查", MB_ICONERROR);
    }
    if (SUCCEEDED(initialized)) CoUninitialize();
    return result;
}
