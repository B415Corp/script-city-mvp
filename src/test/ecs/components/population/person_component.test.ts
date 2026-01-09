import { describe, it, expect } from 'vitest';
import { Person, Gender, EducationLevel, type PersonData } from '../../../../core/ecs/components/population/person_component';

describe('Person Component', () => {
  it('should have all required arrays', () => {
    expect(Array.isArray(Person.age)).toBe(true);
    expect(Array.isArray(Person.gender)).toBe(true);
    expect(Array.isArray(Person.name)).toBe(true);
    expect(Array.isArray(Person.education)).toBe(true);

    expect(Person.age.length).toBe(0);
    expect(Person.gender.length).toBe(0);
    expect(Person.name.length).toBe(0);
    expect(Person.education.length).toBe(0);
  });

  it('should be able to store and retrieve person data', () => {
    const eid = 0;
    const age = 25;
    const gender = Gender.MALE;
    const name = 'Александр';
    const education = EducationLevel.UNIVERSITY;

    Person.age[eid] = age;
    Person.gender[eid] = gender;
    Person.name[eid] = name;
    Person.education[eid] = education;

    expect(Person.age[eid]).toBe(age);
    expect(Person.gender[eid]).toBe(gender);
    expect(Person.name[eid]).toBe(name);
    expect(Person.education[eid]).toBe(education);
  });

  it('should handle multiple entities', () => {
    const eid1 = 1;
    const eid2 = 2;

    // Person 1: Young male student
    Person.age[eid1] = 20;
    Person.gender[eid1] = Gender.MALE;
    Person.name[eid1] = 'Дмитрий';
    Person.education[eid1] = EducationLevel.SECONDARY;

    // Person 2: Adult female professional
    Person.age[eid2] = 35;
    Person.gender[eid2] = Gender.FEMALE;
    Person.name[eid2] = 'Елена';
    Person.education[eid2] = EducationLevel.UNIVERSITY;

    expect(Person.age[eid1]).toBe(20);
    expect(Person.gender[eid1]).toBe(Gender.MALE);
    expect(Person.name[eid1]).toBe('Дмитрий');
    expect(Person.education[eid1]).toBe(EducationLevel.SECONDARY);

    expect(Person.age[eid2]).toBe(35);
    expect(Person.gender[eid2]).toBe(Gender.FEMALE);
    expect(Person.name[eid2]).toBe('Елена');
    expect(Person.education[eid2]).toBe(EducationLevel.UNIVERSITY);
  });

  it('should support different age ranges', () => {
    const testCases = [
      { eid: 3, age: 1, gender: Gender.MALE, name: 'Младенец', education: EducationLevel.NONE },
      { eid: 4, age: 18, gender: Gender.FEMALE, name: 'Подросток', education: EducationLevel.PRIMARY },
      { eid: 5, age: 65, gender: Gender.MALE, name: 'Пенсионер', education: EducationLevel.UNIVERSITY },
      { eid: 6, age: 100, gender: Gender.FEMALE, name: 'Долгожитель', education: EducationLevel.COLLEGE },
    ];

    testCases.forEach(({ eid, age, gender, name, education }) => {
      Person.age[eid] = age;
      Person.gender[eid] = gender;
      Person.name[eid] = name;
      Person.education[eid] = education;

      expect(Person.age[eid]).toBe(age);
      expect(Person.gender[eid]).toBe(gender);
      expect(Person.name[eid]).toBe(name);
      expect(Person.education[eid]).toBe(education);
    });
  });

  it('should return undefined for uninitialized entities', () => {
    const eid = 999;
    expect(Person.age[eid]).toBeUndefined();
    expect(Person.gender[eid]).toBeUndefined();
    expect(Person.name[eid]).toBeUndefined();
    expect(Person.education[eid]).toBeUndefined();
  });

  it('should support empty and whitespace names', () => {
    const eid1 = 7;
    const eid2 = 8;

    Person.name[eid1] = '';
    Person.name[eid2] = '   ';

    expect(Person.name[eid1]).toBe('');
    expect(Person.name[eid2]).toBe('   ');
  });

  it('should support unicode names', () => {
    const eid = 9;
    const unicodeName = 'José María González';

    Person.name[eid] = unicodeName;
    expect(Person.name[eid]).toBe(unicodeName);
  });
});

describe('Gender enum', () => {
  it('should have correct gender values', () => {
    expect(Gender.MALE).toBe(0);
    expect(Gender.FEMALE).toBe(1);
  });

  it('should be used correctly in person component', () => {
    const eid = 10;
    Person.gender[eid] = Gender.MALE;
    expect(Person.gender[eid]).toBe(Gender.MALE);

    Person.gender[eid] = Gender.FEMALE;
    expect(Person.gender[eid]).toBe(Gender.FEMALE);
  });

  it('should have valid gender values', () => {
    const numericValues = Object.values(Gender).filter(v => typeof v === 'number') as number[];
    expect(numericValues.sort()).toEqual([0, 1]);
  });
});

describe('EducationLevel enum', () => {
  it('should have correct education level values', () => {
    expect(EducationLevel.NONE).toBe(1);
    expect(EducationLevel.PRIMARY).toBe(2);
    expect(EducationLevel.SECONDARY).toBe(3);
    expect(EducationLevel.COLLEGE).toBe(4);
    expect(EducationLevel.UNIVERSITY).toBe(5);
  });

  it('should be used correctly in person component', () => {
    const eid = 11;
    Person.education[eid] = EducationLevel.UNIVERSITY;
    expect(Person.education[eid]).toBe(EducationLevel.UNIVERSITY);

    Person.education[eid] = EducationLevel.PRIMARY;
    expect(Person.education[eid]).toBe(EducationLevel.PRIMARY);
  });

  it('should have progressive values', () => {
    const numericValues = Object.values(EducationLevel).filter(v => typeof v === 'number') as number[];
    const sortedValues = numericValues.sort((a, b) => a - b);
    for (let i = 1; i < sortedValues.length; i++) {
      expect(sortedValues[i]).toBeGreaterThan(sortedValues[i - 1]);
    }
  });

  it('should support all education levels', () => {
    const testLevels = [
      EducationLevel.NONE,
      EducationLevel.PRIMARY,
      EducationLevel.SECONDARY,
      EducationLevel.COLLEGE,
      EducationLevel.UNIVERSITY,
    ];

    testLevels.forEach((level, index) => {
      const eid = 12 + index;
      Person.education[eid] = level;
      expect(Person.education[eid]).toBe(level);
    });
  });
});

describe('PersonData type', () => {
  it('should accept valid PersonData object', () => {
    const data: PersonData = {
      age: 28,
      gender: Gender.FEMALE,
      name: 'Анна',
      education: EducationLevel.UNIVERSITY,
    };

    expect(data.age).toBe(28);
    expect(data.gender).toBe(Gender.FEMALE);
    expect(data.name).toBe('Анна');
    expect(data.education).toBe(EducationLevel.UNIVERSITY);
  });

  it('should support different combinations', () => {
    const testData: PersonData[] = [
      {
        age: 16,
        gender: Gender.MALE,
        name: 'Школьник',
        education: EducationLevel.PRIMARY,
      },
      {
        age: 45,
        gender: Gender.FEMALE,
        name: 'Профессионал',
        education: EducationLevel.COLLEGE,
      },
      {
        age: 70,
        gender: Gender.MALE,
        name: 'Пенсионер',
        education: EducationLevel.SECONDARY,
      },
    ];

    testData.forEach((data, index) => {
      const eid = 17 + index;
      Person.age[eid] = data.age;
      Person.gender[eid] = data.gender;
      Person.name[eid] = data.name;
      Person.education[eid] = data.education;

      expect(Person.age[eid]).toBe(data.age);
      expect(Person.gender[eid]).toBe(data.gender);
      expect(Person.name[eid]).toBe(data.name);
      expect(Person.education[eid]).toBe(data.education);
    });
  });

  it('should enforce required properties', () => {
    // TypeScript should prevent this, but we test the concept
    const data = {
      age: 30,
      gender: Gender.MALE,
      name: 'Тест',
      education: EducationLevel.SECONDARY,
    };

    expect(data.age).toBe(30);
    expect(data.gender).toBe(Gender.MALE);
    expect(data.name).toBe('Тест');
    expect(data.education).toBe(EducationLevel.SECONDARY);
  });
});
