const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceDir = '/Users/fernandoandreassi/Documents/GitHub/Prode';
const prototypeDir = path.join(workspaceDir, 'prototype');
const indexHtmlPath = path.join(prototypeDir, 'index.html');
const outputDir = '/Users/fernandoandreassi/.gemini/antigravity/brain/5ae5f0a4-f98f-4b45-98f0-14b3d7c315fe';

// Read index.html content
let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

const screens = ['dashboard', 'predictions', 'groups'];

screens.forEach((screen) => {
  const tempFilename = `temp_${screen}.html`;
  const tempFilePath = path.join(prototypeDir, tempFilename);

  // We inject a script right before the closing </body> tag
  // that automatically runs switchNav for the specific screen.
  const injection = `
  <script>
    window.addEventListener('load', () => {
      // Force switch to screen after DOM load
      setTimeout(() => {
        switchNav('${screen}');
      }, 50);
    });
  </script>
  `;

  let modifiedHtml = htmlContent.replace('</body>', `${injection}</body>`);

  // Write modified file
  fs.writeFileSync(tempFilePath, modifiedHtml, 'utf8');

  // Command to run Chrome Headless
  const chromePath = '"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"';
  const outPngPath = path.join(outputDir, `real_app_${screen}.png`);
  
  // Note: we use --window-size=390,844 to mimic mobile screen, and we add --hide-scrollbars
  const command = `${chromePath} --headless --disable-gpu --screenshot="${outPngPath}" --window-size=390,844 --hide-scrollbars "file://${tempFilePath}"`;

  console.log(`Capturing screen "${screen}"...`);
  try {
    execSync(command);
    console.log(`Successfully captured: real_app_${screen}.png`);
  } catch (error) {
    console.error(`Failed to capture ${screen} screen:`, error.message);
  }

  // Clean up temp file
  try {
    fs.unlinkSync(tempFilePath);
  } catch (err) {}
});

console.log('Capture process finished.');
