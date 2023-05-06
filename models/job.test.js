"use strict";

const db = require("../db.js");
const { BadRequestError, NotFoundError } = require("../expressError");
const Company = require("./company.js");
const Job = require("./job.js");
const {
  commonBeforeAll,
  commonBeforeEach,
  commonAfterEach,
  commonAfterAll,
} = require("./_testCommon");

beforeAll(commonBeforeAll);
beforeEach(commonBeforeEach);
afterEach(commonAfterEach);
afterAll(commonAfterAll);

/************************************** create */

describe("create", function () {
    let newJob = {
      companyHandle: "c1",
      title: "Test",
      salary: 100,
      equity: "0.1",
    };
  
    test("works", async function () {
      let job = await Job.create(newJob);
      expect(job).toEqual({
        ...newJob,
        id: expect.any(Number),
      });
    });
  });

/************************************** findAll */

describe("findAll", function () {
  test("works: no filter", async function () {
    let jobs = await Job.findAll();
    expect(jobs).toEqual([
      {
        id: 1,
        companyHandle: "c1",
        title: "job1",
        salary: 100,
        equity: "0.1",
      },
      {
        id: 2,
        companyHandle: "c2",
        title: "job2",
        salary: 300,
        equity: "0",
      }
    ]);
  });
});

/************************************** findFiltered */

describe("findFiltered", function () {
  test("min salary filter works", async function () {
    let jobs = await Job.findFiltered({minSalary: 200});
    expect(jobs).toEqual([
      {
        id: 2,
        companyHandle: "c2",
        title: "job2",
        salary: 300,
        equity: "0",
      }
    ]);
  });
  test("has equity filter works", async function () {
    let jobs = await Job.findFiltered({hasEquity: true});
    expect(jobs).toEqual([
      {
        id: 1,
        companyHandle: "c1",
        title: "job1",
        salary: 100,
        equity: "0.1",
      }
    ]);
  });

  test("minSalary throw errors when NaN is passed", async function () {
    try {
      await Job.findFiltered({minSalary: true});
    } catch (err) {
      expect(err.message).toBe("minSalary must be a number.");
    }
  });
  

  test("title filter works", async function () {
    let jobs = await Job.findFiltered({title: "job1"});
    expect(jobs).toEqual([
      {
        id: 1,
        companyHandle: "c1",
        title: "job1",
        salary: 100,
        equity: "0.1",
      }
    ]);
  });
});

/************************************** get */

describe("get", function () {
  test("works", async function () {
    let job = await Job.get(1);
    expect(job).toEqual({
      id: 1,
      title: "job1",
      salary: 100,
      equity: "0.1",
      company: {
            description: "Desc1",
            handle: "c1",
            logoUrl: "http://c1.img",
            name: "C1",
            numEmployees: 1
          }
    });
  });

  test("not found if no such job", async function () {
    try {
      await Job.get(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});

/************************************** update */

describe("update", function () {
  const updateData = {
    title: "Updated",
    salary: 200,
    equity: "0.2",
  };

  test("works", async function () {
    let job = await Job.update(1, updateData);
    expect(job).toEqual({
      id: 1,
      companyHandle: "c1",
      ...updateData,
    });

    const result = await db.query(
      `SELECT id, title, salary, equity, company_handle AS "companyHandle"
       FROM jobs
       WHERE id = '1'`);
    expect(result.rows).toEqual([{
      id: 1,
      title: "Updated",
      salary: 200,
      equity: "0.2",
      companyHandle: "c1"
    }]);
  });

  test("works: null fields", async function () {
    const updateDataSetNulls = {
      title: "Updated",
      salary: null,
      equity: null
    };

    let job = await Job.update(1, updateDataSetNulls);
    expect(job).toEqual({
      id: 1,
      companyHandle: "c1",
      ...updateDataSetNulls,
    });

    const result = await db.query(
          `SELECT id, title, salary, equity, company_handle AS "companyHandle"
           FROM jobs
           WHERE id = '1'`);
    expect(result.rows).toEqual([{
      id: 1,
      companyHandle: "c1",
      title: "Updated",
      salary: null,
      equity: null
    }]);
  });

  test("not found if no such company", async function () {
    try {
      await Job.update(0, updateData);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });

  test("bad request with no data", async function () {
    try {
      await Job.update(1, {});
      fail();
    } catch (err) {
      expect(err instanceof BadRequestError).toBeTruthy();
    }
  });
});

/************************************** remove */

describe("remove", function () {
  test("works", async function () {
    await Job.remove(1);
    const res = await db.query(
        "SELECT id FROM jobs WHERE id='1'");
    expect(res.rows.length).toEqual(0);
  });

  test("not found if no such company", async function () {
    try {
      await Job.remove(0);
      fail();
    } catch (err) {
      expect(err instanceof NotFoundError).toBeTruthy();
    }
  });
});
