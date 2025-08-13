const { spawn } = require('child_process');
const waitOn = require('wait-on');

const startElectron = () => {
  console.log('🚀 Démarrage d\'Electron...');
  const electronProcess = spawn('npx', ['electron', '.'], {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'development' }
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron s'est fermé avec le code ${code}`);
    process.exit(code);
  });

  return electronProcess;
};

const main = async () => {
  console.log('⏳ Attente du serveur de développement...');
  
  try {
    await waitOn({
      resources: ['http://localhost:8080'],
      delay: 1000,
      timeout: 30000,
    });
    
    console.log('✅ Serveur de développement prêt!');
    startElectron();
  } catch (error) {
    console.error('❌ Erreur lors de l\'attente du serveur:', error);
    process.exit(1);
  }
};

main();