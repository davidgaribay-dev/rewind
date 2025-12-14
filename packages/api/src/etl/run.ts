import * as dotenv from 'dotenv';
import { ETLService } from '@/etl/service';

dotenv.config({ path: '../../.env' });

const etl = new ETLService();
etl.run()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
