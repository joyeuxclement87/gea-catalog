import { loadEnvConfig } from '@next/env';
import path from 'path';

const projectDir = path.join(__dirname, '..');
loadEnvConfig(projectDir);

// Run the import script directly
import('./import-to-supabase.js').catch(console.error);