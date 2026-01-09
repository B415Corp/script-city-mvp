import { System } from '..';

export const TestSystem: System = {
  name: 'Test',
  components: ['Person'],
  update: (world, entities) => {
    if (entities.length > 0) {
      console.log('TestSystem');
    }
  },
};
