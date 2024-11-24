const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');
const AdmZip = require('adm-zip');

async function downloadFile(url, dest) {
    console.log(`Downloading from ${url} to ${dest}`);
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('Download completed');
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function setupPython() {
    const pythonDir = path.resolve(__dirname, '..', 'py_tools', 'python');
    console.log('Python directory:', pythonDir);

    try {
        // Slet eksisterende Python mappe hvis den findes
        if (fs.existsSync(pythonDir)) {
            console.log('Removing existing Python directory');
            fs.rmSync(pythonDir, { recursive: true, force: true });
        }

        // Opret ny Python mappe
        console.log('Creating Python directory');
        fs.mkdirSync(pythonDir, { recursive: true });

        // Download embedded Python
        const embeddedPythonUrl = 'https://www.python.org/ftp/python/3.9.7/python-3.9.7-embed-amd64.zip';
        const zipPath = path.join(pythonDir, 'python.zip');
        
        console.log('Downloading Python...');
        await downloadFile(embeddedPythonUrl, zipPath);
        
        // Udpak zip fil
        console.log('Extracting Python...');
        const zip = new AdmZip(zipPath);
        zip.extractAllTo(pythonDir, true);
        
        console.log('Cleaning up zip file');
        fs.unlinkSync(zipPath);

        // Tilføj site-packages til python39._pth
        const pthPath = path.join(pythonDir, 'python39._pth');
        let pthContent = fs.readFileSync(pthPath, 'utf8');
        if (!pthContent.includes('Lib/site-packages')) {
            pthContent = pthContent.replace('#import site', 'import site\nLib/site-packages');
            fs.writeFileSync(pthPath, pthContent);
        }

        // Opret Lib/site-packages mappe
        const sitePackagesDir = path.join(pythonDir, 'Lib', 'site-packages');
        fs.mkdirSync(sitePackagesDir, { recursive: true });

        // Verificer at python.exe findes
        const pythonExe = path.join(pythonDir, 'python.exe');
        if (!fs.existsSync(pythonExe)) {
            throw new Error(`Python executable not found at: ${pythonExe}`);
        }
        console.log('Python executable found at:', pythonExe);

        // Setup pip
        console.log('Setting up pip...');
        const getPipUrl = 'https://bootstrap.pypa.io/get-pip.py';
        const getPipPath = path.join(pythonDir, 'get-pip.py');
        await downloadFile(getPipUrl, getPipPath);

        // Installer pip
        console.log('Installing pip...');
        execSync(`"${pythonExe}" "${getPipPath}"`, { 
            stdio: 'inherit',
            cwd: pythonDir,
            env: {
                ...process.env,
                PYTHONPATH: sitePackagesDir
            }
        });

        // Tilføj Scripts mappe til PATH
        const scriptsDir = path.join(pythonDir, 'Scripts');
        process.env.PATH = `${scriptsDir};${process.env.PATH}`;

        // Installer requirements
        console.log('Installing requirements...');
        const requirementsPath = path.resolve(__dirname, '..', 'py_tools', 'requirements.txt');
        execSync(`"${pythonExe}" -m pip install -r "${requirementsPath}"`, { 
            stdio: 'inherit',
            cwd: pythonDir,
            env: {
                ...process.env,
                PYTHONPATH: sitePackagesDir
            }
        });

        console.log('Python setup completed successfully');
    } catch (error) {
        console.error('Error during Python setup:', error);
        throw error;
    }
}

setupPython().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
}); 