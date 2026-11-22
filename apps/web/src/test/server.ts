import { handlers } from '@afro/common/mocks';
import { setupServer } from 'msw/node';

export const server = setupServer(...handlers);
