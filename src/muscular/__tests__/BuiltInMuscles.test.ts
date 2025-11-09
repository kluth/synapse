import {
  ComputeMuscle,
  TransformMuscle,
  AggregateMuscle,
  FilterMuscle,
  SortMuscle,
  MapMuscle,
  ReduceMuscle,
} from '../built-in';

describe('Built-in Muscles', () => {
  describe('ComputeMuscle', () => {
    it('should perform addition', () => {
      const add = ComputeMuscle.add();
      expect(add.execute(5, 3)).toBe(8);
    });

    it('should perform subtraction', () => {
      const subtract = ComputeMuscle.subtract();
      expect(subtract.execute(10, 4)).toBe(6);
    });

    it('should perform multiplication', () => {
      const multiply = ComputeMuscle.multiply();
      expect(multiply.execute(6, 7)).toBe(42);
    });

    it('should perform division', () => {
      const divide = ComputeMuscle.divide();
      expect(divide.execute(20, 4)).toBe(5);
    });

    it('should perform power', () => {
      const power = ComputeMuscle.power();
      expect(power.execute(2, 8)).toBe(256);
    });

    it('should perform modulo', () => {
      const mod = ComputeMuscle.modulo();
      expect(mod.execute(17, 5)).toBe(2);
    });

    it('should calculate absolute value', () => {
      const abs = ComputeMuscle.abs();
      expect(abs.execute(-42)).toBe(42);
      expect(abs.execute(42)).toBe(42);
    });

    it('should calculate square root', () => {
      const sqrt = ComputeMuscle.sqrt();
      expect(sqrt.execute(16)).toBe(4);
      expect(sqrt.execute(9)).toBe(3);
    });

    it('should round numbers', () => {
      const round = ComputeMuscle.round();
      expect(round.execute(4.6)).toBe(5);
      expect(round.execute(4.4)).toBe(4);
    });

    it('should calculate floor', () => {
      const floor = ComputeMuscle.floor();
      expect(floor.execute(4.9)).toBe(4);
    });

    it('should calculate ceil', () => {
      const ceil = ComputeMuscle.ceil();
      expect(ceil.execute(4.1)).toBe(5);
    });
  });

  describe('TransformMuscle', () => {
    it('should convert to string', () => {
      const toString = TransformMuscle.toString();
      expect(toString.execute(42)).toBe('42');
      expect(toString.execute(true)).toBe('true');
    });

    it('should convert to number', () => {
      const toNumber = TransformMuscle.toNumber();
      expect(toNumber.execute('42')).toBe(42);
      expect(toNumber.execute('3.14')).toBe(3.14);
    });

    it('should convert to boolean', () => {
      const toBool = TransformMuscle.toBoolean();
      expect(toBool.execute(1)).toBe(true);
      expect(toBool.execute(0)).toBe(false);
      expect(toBool.execute('true')).toBe(true);
      expect(toBool.execute('')).toBe(false);
    });

    it('should convert to uppercase', () => {
      const upper = TransformMuscle.toUpperCase();
      expect(upper.execute('hello')).toBe('HELLO');
    });

    it('should convert to lowercase', () => {
      const lower = TransformMuscle.toLowerCase();
      expect(lower.execute('HELLO')).toBe('hello');
    });

    it('should trim strings', () => {
      const trim = TransformMuscle.trim();
      expect(trim.execute('  hello  ')).toBe('hello');
    });

    it('should parse JSON', () => {
      const parseJSON = TransformMuscle.parseJSON();
      expect(parseJSON.execute('{"name":"John","age":30}')).toEqual({ name: 'John', age: 30 });
    });

    it('should stringify to JSON', () => {
      const stringifyJSON = TransformMuscle.stringifyJSON();
      expect(stringifyJSON.execute({ name: 'John', age: 30 })).toBe('{"name":"John","age":30}');
    });

    it('should split strings', () => {
      const split = TransformMuscle.split(',');
      expect(split.execute('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('should join arrays', () => {
      const join = TransformMuscle.join(',');
      expect(join.execute(['a', 'b', 'c'])).toBe('a,b,c');
    });
  });

  describe('AggregateMuscle', () => {
    it('should sum numbers', () => {
      const sum = AggregateMuscle.sum();
      expect(sum.execute([1, 2, 3, 4, 5])).toBe(15);
    });

    it('should calculate average', () => {
      const avg = AggregateMuscle.average();
      expect(avg.execute([10, 20, 30])).toBe(20);
    });

    it('should find minimum', () => {
      const min = AggregateMuscle.min();
      expect(min.execute([5, 2, 8, 1, 9])).toBe(1);
    });

    it('should find maximum', () => {
      const max = AggregateMuscle.max();
      expect(max.execute([5, 2, 8, 1, 9])).toBe(9);
    });

    it('should count items', () => {
      const count = AggregateMuscle.count();
      expect(count.execute([1, 2, 3, 4, 5])).toBe(5);
    });

    it('should find first item', () => {
      const first = AggregateMuscle.first();
      expect(first.execute([1, 2, 3])).toBe(1);
    });

    it('should find last item', () => {
      const last = AggregateMuscle.last();
      expect(last.execute([1, 2, 3])).toBe(3);
    });
  });

  describe('FilterMuscle', () => {
    it('should filter by predicate', () => {
      const filterEven = FilterMuscle.create((...args: unknown[]) => {
        const x = args[0] as number;
        return x % 2 === 0;
      });
      expect(filterEven.execute([1, 2, 3, 4, 5, 6])).toEqual([2, 4, 6]);
    });

    it('should filter greater than', () => {
      const greaterThan5 = FilterMuscle.greaterThan(5);
      expect(greaterThan5.execute([1, 3, 5, 7, 9])).toEqual([7, 9]);
    });

    it('should filter less than', () => {
      const lessThan5 = FilterMuscle.lessThan(5);
      expect(lessThan5.execute([1, 3, 5, 7, 9])).toEqual([1, 3]);
    });

    it('should filter equal to', () => {
      const equalTo5 = FilterMuscle.equalTo(5);
      expect(equalTo5.execute([1, 3, 5, 5, 7])).toEqual([5, 5]);
    });

    it('should filter truthy values', () => {
      const truthy = FilterMuscle.truthy();
      expect(truthy.execute([0, 1, '', 'hello', null, 42, undefined])).toEqual([1, 'hello', 42]);
    });

    it('should filter unique values', () => {
      const unique = FilterMuscle.unique();
      expect(unique.execute([1, 2, 2, 3, 3, 3, 4])).toEqual([1, 2, 3, 4]);
    });
  });

  describe('SortMuscle', () => {
    it('should sort numbers ascending', () => {
      const sortAsc = SortMuscle.ascending();
      expect(sortAsc.execute([5, 2, 8, 1, 9])).toEqual([1, 2, 5, 8, 9]);
    });

    it('should sort numbers descending', () => {
      const sortDesc = SortMuscle.descending();
      expect(sortDesc.execute([5, 2, 8, 1, 9])).toEqual([9, 8, 5, 2, 1]);
    });

    it('should sort by comparator', () => {
      const sortByLength = SortMuscle.by<string>((a, b) => a.length - b.length);
      expect(sortByLength.execute(['aaa', 'a', 'aa', 'aaaa'])).toEqual(['a', 'aa', 'aaa', 'aaaa']);
    });

    it('should sort objects by property', () => {
      const sortByAge = SortMuscle.byProperty<{ name: string; age: number }>('age');
      const people = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
        { name: 'Charlie', age: 35 },
      ];
      expect(sortByAge.execute(people)).toEqual([
        { name: 'Bob', age: 25 },
        { name: 'Alice', age: 30 },
        { name: 'Charlie', age: 35 },
      ]);
    });
  });

  describe('MapMuscle', () => {
    it('should map with function', () => {
      const double = MapMuscle.create((...args: unknown[]) => {
        const x = args[0] as number;
        return x * 2;
      });
      expect(double.execute([1, 2, 3, 4])).toEqual([2, 4, 6, 8]);
    });

    it('should extract property', () => {
      const getNames = MapMuscle.property<{ name: string; age: number }>('name');
      const people = [
        { name: 'Alice', age: 30 },
        { name: 'Bob', age: 25 },
      ];
      expect(getNames.execute(people)).toEqual(['Alice', 'Bob']);
    });

    it('should map with index', () => {
      const withIndex = MapMuscle.withIndex((...args: unknown[]) => {
        const x = args[0] as string;
        const i = args[1] as number;
        return `${i}: ${x}`;
      });
      expect(withIndex.execute(['a', 'b', 'c'])).toEqual(['0: a', '1: b', '2: c']);
    });
  });

  describe('ReduceMuscle', () => {
    it('should reduce with accumulator', () => {
      const sum = ReduceMuscle.create((...args: unknown[]) => {
        const acc = args[0] as number;
        const val = args[1] as number;
        return acc + val;
      }, 0);
      expect(sum.execute([1, 2, 3, 4])).toBe(10);
    });

    it('should concatenate strings', () => {
      const concat = ReduceMuscle.create((...args: unknown[]) => {
        const acc = args[0] as string;
        const val = args[1] as string;
        return acc + val;
      }, '');
      expect(concat.execute(['Hello', ' ', 'World'])).toBe('Hello World');
    });

    it('should group by property', () => {
      const groupByType = ReduceMuscle.groupBy<{ type: string; value: number }>('type');
      const items = [
        { type: 'A', value: 1 },
        { type: 'B', value: 2 },
        { type: 'A', value: 3 },
      ];
      expect(groupByType.execute(items)).toEqual({
        A: [
          { type: 'A', value: 1 },
          { type: 'A', value: 3 },
        ],
        B: [{ type: 'B', value: 2 }],
      });
    });
  });

  describe('Integration', () => {
    it('should compose multiple built-in muscles', () => {
      // Filter even numbers, double them, then sum
      const filterEven = FilterMuscle.create((...args: unknown[]) => {
        const x = args[0] as number;
        return x % 2 === 0;
      });
      const double = MapMuscle.create((...args: unknown[]) => {
        const x = args[0] as number;
        return x * 2;
      });
      const sum = AggregateMuscle.sum();

      const numbers = [1, 2, 3, 4, 5, 6];
      const filtered = filterEven.execute(numbers); // [2, 4, 6]
      const doubled = double.execute(filtered); // [4, 8, 12]
      const result = sum.execute(doubled); // 24

      expect(result).toBe(24);
    });
  });
});
