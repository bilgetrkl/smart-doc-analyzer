# Smart Doc Analyzer - Modern Frontend

Bu projede gradient bağımlılığı olmadan modern bir React arayüzü oluşturulmuştur.

## Kurulum ve Çalıştırma

### 1. Frontend Kurulumu

```bash
# Frontend dizinine gidin
cd /home/bilge/smartdoc/frontend

# Bağımlılıkları yükleyin
npm install

# Geliştirme sunucusunu başlatın
npm run dev
```

### 2. Backend'i Çalıştırma

Başka bir terminal penceresi açın:

```bash
# Proje ana dizinine gidin
cd /home/bilge/smartdoc

# Virtual environment'ı aktif edin
source venv/bin/activate

# Backend'i çalıştırın
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 3. Uygulama Erişimi

- **Frontend**: http://localhost:3000
- **Backend API**: http://127.0.0.1:8000

## Özellikler

### Modern Tasarım
- ✨ Glassmorphism efektleri
- 🎨 Gradient arka planlar
- 🌈 Smooth animasyonlar (Framer Motion)
- 📱 Responsive tasarım
- 🎯 Modern iconlar (Lucide React)

### Kullanıcı Deneyimi
- 🖱️ Drag & Drop dosya yükleme
- ⚡ Real-time feedback
- 🔄 Loading states
- ❌ Hata yönetimi
- ✅ Başarı mesajları

### Teknik Özellikler
- ⚛️ React 18 + Vite
- 🎨 Tailwind CSS
- 📦 Modern build tools
- 🔥 Hot reload
- 🛠️ TypeScript desteği

## Proje Yapısı

```
frontend/
├── src/
│   ├── App.jsx          # Ana uygulama komponenti
│   ├── main.jsx         # React entry point
│   └── index.css        # Global stiller
├── package.json         # Dependencies
├── vite.config.js       # Vite konfigürasyonu
├── tailwind.config.js   # Tailwind konfigürasyonu
└── index.html           # HTML template
```

## API Entegrasyonu

Frontend, mevcut FastAPI backend'i ile çalışacak şekilde tasarlanmıştır:
- Endpoint: `/qa/ask-pdf`
- Method: POST
- Format: FormData (file + question)

## Troubleshooting

### Port Conflicts
Eğer 3000 portu kullanılıyorsa, vite.config.js'de farklı bir port belirleyebilirsiniz.

### CORS Errors
Backend'in CORS ayarlarının doğru olduğundan emin olun (main.py'de zaten yapılandırılmış).

### Build Issues
Eğer npm install sırasında hata alırsanız:
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```