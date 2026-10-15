/**
 * Регистрация игрового ECS-контента.
 *
 * Компоненты, системы, фабрики и кластеры регистрируются в реестрах на импорте
 * (см. `createComponent`/`createSystem`/`createCluster`/`createEntityFactory`).
 * Этот модуль — единственная точка, которую импортирует рантайм: он тянет только
 * игровой контент, без бенчмарков и тестовых заглушек.
 */

// Компоненты
import './components/citizen_components';
import './components/zone_components';

// Фабрики сущностей
import './entities/citizen_factory';

// Системы
import './systems/work_income_system';
import './systems/zone_spawn_system';

// Кластеры
import './clusters/first_sim_cluster';
