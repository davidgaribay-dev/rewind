import * as dotenv from 'dotenv';
import { ETLService } from '@/etl/service';

dotenv.config({ path: '../../.env' });

const etl = new ETLService();
etl.run()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('ETL Error:', error);
    process.exit(1);
  });
