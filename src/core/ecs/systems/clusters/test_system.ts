import { System } from '..';

export const TestSystem: System = {
  name: 'Test',
  components: ['Person'],
  update: (world, entities) => {
    console.log('TestSystem');
  },
};
