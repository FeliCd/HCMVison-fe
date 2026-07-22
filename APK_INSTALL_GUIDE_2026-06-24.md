# HCMVision APK install guide - 2026-06-24

## File APK

- File demo: `builds/HCMVision-demo-2026-06-24.apk`
- SHA256: `8453570407D06EC80DA4F437403D486A8C677CC9DE348FF9220863B36621B5BC`
- Package: `com.anonymous.HCMVision`
- Version: `1.0.0`
- Android toi thieu: Android 7.0, API 24
- Kien truc ho tro: `arm64-v8a`, `armeabi-v7a`, `x86`, `x86_64`

## Cai bang Android Studio/emulator

1. Mo emulator hoac cam dien thoai Android vao may tinh.
2. Bat USB debugging neu dung dien thoai that.
3. Chay lenh tu thu muc `E:\HCMVison-fe`:

```powershell
adb install -r builds\HCMVision-demo-2026-06-24.apk
```

4. Mo app `HCMVision` tren may Android.

## Gui sang may Android khac

1. Gui file `builds/HCMVision-demo-2026-06-24.apk` qua USB, Google Drive, Zalo, Telegram, email hoac bat ky kenh chia se file nao.
2. Tren dien thoai nhan file, cham vao file APK.
3. Neu may bao chan cai dat, vao man hinh cho phep `Install unknown apps` cho ung dung dang mo file, vi du `Files`, `Chrome`, `Drive` hoac `Zalo`.
4. Chon `Install`.
5. Mo app `HCMVision`.

Neu may da cai ban cu va bao loi chu ky hoac khong cai de len duoc, hay go cai dat `HCMVision` cu roi cai lai APK nay.

## Cach dung nhanh khi demo

1. Mo app, khong can dang nhap de xem `Ban do`, `Camera`, `Canh bao`, `Chi tiet camera` va `Tro ly AI`.
2. Khi app hoi quyen vi tri, cho phep neu muon dung ban do/tuyen duong sat thuc te hon.
3. Nut dang ky nhan canh bao moi yeu cau dang nhap.
4. Dang nhap user de quan ly dang ky canh bao.
5. Dang nhap admin de vao khu quan tri: tong quan, ban do, camera, cai dat, quan ly tai khoan, suc khoe he thong va dong bo du lieu.

## Luu y

- APK nay tro prod API: `https://hcmvision-api.onrender.com/api`.
- Dien thoai can co internet.
- Render backend co the cham o request dau tien neu bi cold start.
- Chatbot endpoint dang hoat dong va tra `{ reply }`, nhung neu RemoteQwen runtime chua san sang thi app se hien fallback tu backend.
- APK nay du de demo/cai tay, chua phai ban signed release chinh thuc cho Play Store.
