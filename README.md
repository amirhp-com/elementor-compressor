
# Elementor Compressor

A high-performance utility to optimize Elementor JSON files by removing redundant properties, empty sizes, and useless metadata while preserving functionality.

Built by [AmirhpCom](https://amirhp.com) | GitHub: [github.com/amirhp-com](https://github.com/amirhp-com)

---

## 🚀 How to Run & Deploy

### 1. Running Locally
To run the app on your own computer:
1.  **Install Node.js**: Ensure you have [Node.js](https://nodejs.org/) installed.
2.  **Install Dependencies**: Open your terminal in the project folder and run:
    ```bash
    npm install
    ```
3.  **Start Dev Server**: Run the following command:
    ```bash
    npm run dev
    ```
4.  **Access App**: Open your browser and go to `http://localhost:5173`.

### 2. Deploying to GitHub Pages
GitHub Pages is the easiest way to host this for free.
1.  **Create a Repository**: Create a new repo on GitHub named `elementor-compressor`.
2.  **Push Code**: Push your files to the `main` branch.
3.  **Configure GitHub Actions**:
    - Go to your Repo **Settings** > **Pages**.
    - Under **Build and deployment** > **Source**, select **GitHub Actions**.
    - Click "Configure" on the **Static HTML** or **Vite** template, or simply create a file at `.github/workflows/deploy.yml` with a standard Vite deployment workflow.
4.  **Automatic Build**: Every time you push to `main`, GitHub will build and deploy the app automatically.

### 3. Deploying to cPanel (Shared Hosting)
If you want to host it on your own domain (e.g., `tools.amirhp.com`):
1.  **Build the Project**: Run the build command locally:
    ```bash
    npm run build
    ```
2.  **Locate 'dist' Folder**: This will create a `dist` folder in your project root.
3.  **Upload to cPanel**:
    - Log in to your cPanel File Manager.
    - Navigate to the directory where you want the app (e.g., `public_html/elementor-compressor`).
    - Upload all files *inside* the `dist` folder to that directory.
4.  **Done**: Your app is now live on your website.

---

## 🛠 Features
- **Redundancy Stripping**: Removes empty typography units and useless metadata.
- **Deep Cleaning**: Recursively cleans elements and settings.
- **Syntax Highlighting**: Real-time JSON highlighting using PrismJS.
- **Shortcuts**: Use `Ctrl + Enter` (or `Cmd + Enter`) to quickly compress.
- **Stats**: Live tracking of file size reduction and removed key counts.
- **Formatters**: Built-in Prettifier and Minifier for both Input and Output.

## 📄 License & Disclaimer
MIT License - Copyright (c) 2024 AmirhpCom.
**Disclaimer**: This tool is for optimization purposes. Always keep a backup of your original Elementor JSON files.
