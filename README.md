
# 🌾 Farm Seva App

Farm Seva is a **digital farm management app** designed to help pig and poultry farmers implement **biosecurity measures** and improve productivity.  
It integrates **Supabase backend services**, a **React Native (Expo) frontend**, and a small **Node.js/TypeScript server** for custom APIs.

---

## 🚀 Features
- 📱 **Cross-platform mobile app** (Android & iOS via Expo).  
- 🔐 **Authentication & Authorization** using Supabase.  
- 📊 **Farm data management** – record animal details, feed, vaccinations, and health logs.  
- 🛡 **Biosecurity monitoring** – track compliance with farm safety standards.  
- ☁ **Cloud backend** with Supabase (database, storage, and API).  
- ⚡ **Real-time sync** between app and backend.  

---

## 🛠 Tech Stack
- **Frontend:** [React Native](https://reactnative.dev/) (Expo)  
- **Backend:** [Node.js](https://nodejs.org/) + [TypeScript](https://www.typescriptlang.org/)  
- **Database & Auth:** [Supabase](https://supabase.com/)  
- **Package manager:** npm / yarn  

---

## 📂 Project Structure
```

Farm-Seva-App/
│── app/              # Main application screens
│── assets/           # Images, icons, fonts
│── components/       # Reusable UI components
│── hooks/            # Custom React hooks
│── lib/              # Utility functions
│── supabase/         # Supabase configuration
│── server.ts         # Node.js/TypeScript backend server
│── package.json      # Dependencies & scripts
│── app.json          # Expo configuration

````

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/Farm-Seva-App.git
cd Farm-Seva-App
````

### 2️⃣ Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

### 3️⃣ Setup Supabase

* Create a Supabase project at [supabase.com](https://supabase.com/).
* Copy your **API URL** and **anon/public key**.
* Add them in your environment configuration (e.g., `.env` file or `supabase/config.ts`).

### 4️⃣ Run the mobile app

```bash
npx expo start
```

* Scan the QR code using **Expo Go app** (Android/iOS).
* Or run on an emulator:

  ```bash
  npm run android
  npm run ios
  ```

### 5️⃣ Run the backend server (optional)

```bash
npx ts-node server.ts
```

---

## 📜 Scripts

From `package.json`, you can run:

```bash
npm start        # Start Expo dev server
npm run android  # Run on Android emulator/device
npm run ios      # Run on iOS simulator/device
npm run web      # Run in web browser
```

---

## 🤝 Contributing

Contributions are welcome!

1. Fork the repo
2. Create a feature branch (`git checkout -b feature-name`)
3. Commit changes (`git commit -m 'Add feature'`)
4. Push branch (`git push origin feature-name`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute it.

---

⚡ **Farm Seva – Empowering farmers with digital tools for a safer, more productive future.**

