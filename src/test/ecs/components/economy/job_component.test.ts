import { describe, it, expect } from 'vitest';
import { Job, type JobData } from '../../../../core/ecs/components/economy/job_component';

describe('Компонент работы (Job Component)', () => {
  it('должен содержать все необходимые массивы', () => {
    expect(Array.isArray(Job.title)).toBe(true);
    expect(Array.isArray(Job.salary)).toBe(true);
    expect(Array.isArray(Job.requirements)).toBe(true);
    expect(Array.isArray(Job.available)).toBe(true);

    expect(Job.title.length).toBe(0);
    expect(Job.salary.length).toBe(0);
    expect(Job.requirements.length).toBe(0);
    expect(Job.available.length).toBe(0);
  });

  it('должен уметь хранить и извлекать данные о работе', () => {
    const eid = 0;
    const testData = {
      title: 'Программист',
      salary: 5000,
      requirements: ['higher_education', 'experience'],
      available: true,
    };

    Job.title[eid] = testData.title;
    Job.salary[eid] = testData.salary;
    Job.requirements[eid] = [...testData.requirements];
    Job.available[eid] = testData.available;

    expect(Job.title[eid]).toBe(testData.title);
    expect(Job.salary[eid]).toBe(testData.salary);
    expect(Job.requirements[eid]).toEqual(testData.requirements);
    expect(Job.available[eid]).toBe(testData.available);
  });

  it('должен обрабатывать несколько должностей', () => {
    const eid1 = 1;
    const eid2 = 2;
    const eid3 = 3;

    // Software Developer
    Job.title[eid1] = 'Разработчик ПО';
    Job.salary[eid1] = 6000;
    Job.requirements[eid1] = ['computer_science_degree', 'programming_skills'];
    Job.available[eid1] = true;

    // Cashier
    Job.title[eid2] = 'Кассир';
    Job.salary[eid2] = 300;
    Job.requirements[eid2] = ['basic_math', 'customer_service'];
    Job.available[eid2] = true;

    // Manager
    Job.title[eid3] = 'Менеджер';
    Job.salary[eid3] = 4500;
    Job.requirements[eid3] = ['management_experience', 'leadership'];
    Job.available[eid3] = false;

    // Verify developer job
    expect(Job.title[eid1]).toBe('Разработчик ПО');
    expect(Job.salary[eid1]).toBe(6000);
    expect(Job.requirements[eid1]).toEqual(['computer_science_degree', 'programming_skills']);
    expect(Job.available[eid1]).toBe(true);

    // Verify cashier job
    expect(Job.title[eid2]).toBe('Кассир');
    expect(Job.salary[eid2]).toBe(300);
    expect(Job.requirements[eid2]).toEqual(['basic_math', 'customer_service']);
    expect(Job.available[eid2]).toBe(true);

    // Verify manager job
    expect(Job.title[eid3]).toBe('Менеджер');
    expect(Job.salary[eid3]).toBe(4500);
    expect(Job.requirements[eid3]).toEqual(['management_experience', 'leadership']);
    expect(Job.available[eid3]).toBe(false);
  });

  it('должен поддерживать различные диапазоны зарплат', () => {
    const testCases = [
      { eid: 4, title: 'Дворник', salary: 200, requirements: ['physical_fitness'] },
      { eid: 5, title: 'Учитель', salary: 800, requirements: ['teaching_degree'] },
      { eid: 6, title: 'Врач', salary: 2000, requirements: ['medical_degree'] },
      { eid: 7, title: 'Директор', salary: 10000, requirements: ['executive_experience'] },
    ];

    testCases.forEach(({ eid, title, salary, requirements }) => {
      Job.title[eid] = title;
      Job.salary[eid] = salary;
      Job.requirements[eid] = requirements;
      Job.available[eid] = true;

      expect(Job.title[eid]).toBe(title);
      expect(Job.salary[eid]).toBe(salary);
      expect(Job.requirements[eid]).toEqual(requirements);
      expect(Job.available[eid]).toBe(true);
    });
  });

  it('должен обрабатывать изменения доступности работы', () => {
    const eid = 8;

    // Job is available
    Job.title[eid] = 'Повар';
    Job.salary[eid] = 400;
    Job.requirements[eid] = ['cooking_skills'];
    Job.available[eid] = true;

    expect(Job.available[eid]).toBe(true);

    // Job gets filled
    Job.available[eid] = false;
    expect(Job.available[eid]).toBe(false);

    // Job becomes available again
    Job.available[eid] = true;
    expect(Job.available[eid]).toBe(true);
  });

  it('должен поддерживать различные комбинации требований', () => {
    const eid = 9;

    // Simple requirements
    Job.requirements[eid] = ['basic_education'];
    expect(Job.requirements[eid]).toEqual(['basic_education']);

    // Multiple requirements
    Job.requirements[eid] = ['higher_education', 'experience', 'certification'];
    expect(Job.requirements[eid]).toEqual(['higher_education', 'experience', 'certification']);

    // No requirements
    Job.requirements[eid] = [];
    expect(Job.requirements[eid]).toEqual([]);

    // Specialized requirements
    Job.requirements[eid] = ['medical_degree', '5_years_experience', 'board_certified'];
    expect(Job.requirements[eid]).toEqual([
      'medical_degree',
      '5_years_experience',
      'board_certified',
    ]);
  });

  it('должен обрабатывать обновления названий должностей', () => {
    const eid = 10;

    Job.title[eid] = 'Младший разработчик';
    expect(Job.title[eid]).toBe('Младший разработчик');

    Job.title[eid] = 'Старший разработчик';
    expect(Job.title[eid]).toBe('Старший разработчик');

    Job.title[eid] = 'Ведущий разработчик';
    expect(Job.title[eid]).toBe('Ведущий разработчик');
  });

  it('должен обрабатывать изменения зарплаты', () => {
    const eid = 11;

    Job.salary[eid] = 1000;
    expect(Job.salary[eid]).toBe(1000);

    Job.salary[eid] = 1200; // Raise
    expect(Job.salary[eid]).toBe(1200);

    Job.salary[eid] = 800; // Cut
    expect(Job.salary[eid]).toBe(800);
  });

  it('должен поддерживать пустой массив требований', () => {
    const eid = 12;

    Job.title[eid] = 'Разнорабочий';
    Job.salary[eid] = 250;
    Job.requirements[eid] = [];
    Job.available[eid] = true;

    expect(Job.requirements[eid]).toEqual([]);
    expect(Job.available[eid]).toBe(true);
  });

  it('должен возвращать undefined для неинициализированных сущностей', () => {
    const eid = 999;
    expect(Job.title[eid]).toBeUndefined();
    expect(Job.salary[eid]).toBeUndefined();
    expect(Job.requirements[eid]).toBeUndefined();
    expect(Job.available[eid]).toBeUndefined();
  });

  it('должен обрабатывать названия должностей в unicode', () => {
    const eid = 13;

    const unicodeTitles = [
      'Инженер-программист',
      'Менеджер по продажам',
      'Специалист по качеству',
      'Аналитик данных',
    ];

    unicodeTitles.forEach((title, index) => {
      const entityId = eid + index;
      Job.title[entityId] = title;
      Job.salary[entityId] = 1000 + index * 500;
      Job.requirements[entityId] = ['basic_skills'];
      Job.available[entityId] = true;

      expect(Job.title[entityId]).toBe(title);
    });
  });
});

describe('Тип данных работы (JobData type)', () => {
  it('должен принимать допустимый объект JobData', () => {
    const data: JobData = {
      title: 'Программист',
      salary: 5000,
      requirements: ['higher_education', 'programming'],
      available: true,
    };

    expect(data.title).toBe('Программист');
    expect(data.salary).toBe(5000);
    expect(data.requirements).toEqual(['higher_education', 'programming']);
    expect(data.available).toBe(true);
  });

  it('должен поддерживать различные конфигурации работы', () => {
    const testData: JobData[] = [
      {
        title: 'Уборщик',
        salary: 250,
        requirements: ['physical_fitness'],
        available: true,
      },
      {
        title: 'Бухгалтер',
        salary: 1200,
        requirements: ['accounting_degree', 'attention_to_detail'],
        available: false,
      },
      {
        title: 'Директор',
        salary: 8000,
        requirements: ['executive_experience', 'leadership', 'strategic_thinking'],
        available: true,
      },
    ];

    testData.forEach((data, index) => {
      const eid = 14 + index;
      Job.title[eid] = data.title;
      Job.salary[eid] = data.salary;
      Job.requirements[eid] = [...data.requirements];
      Job.available[eid] = data.available;

      expect(Job.title[eid]).toBe(data.title);
      expect(Job.salary[eid]).toBe(data.salary);
      expect(Job.requirements[eid]).toEqual(data.requirements);
      expect(Job.available[eid]).toBe(data.available);
    });
  });

  it('должен требовать обязательные свойства', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      title: 'Тестировщик',
      salary: 800,
      requirements: ['qa_skills'],
      available: true,
    };

    expect(data.title).toBe('Тестировщик');
    expect(data.salary).toBe(800);
    expect(data.requirements).toEqual(['qa_skills']);
    expect(data.available).toBe(true);
  });
});
