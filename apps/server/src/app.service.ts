import { Injectable } from '@nestjs/common';
import { HelloResponse } from '../../../packages/api-types/dist';

@Injectable()
export class AppService {
  async getHello(): Promise<HelloResponse> {
    return {
      message: 'Hello from the backend!',
    };
  }
}
