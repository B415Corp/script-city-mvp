import world from '../esc_store';
import { addEntity, addComponent } from 'bitecs';

const house = addEntity(world);

addComponent(world, house, {
  level: [] as number[],
});

export default house;
