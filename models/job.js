"use strict";

const db = require("../db");
const { BadRequestError, NotFoundError } = require("../expressError");
const { sqlForPartialUpdate } = require("../helpers/sql");

/** Related functions for jobs. */

class Job {
  /** Create a job (from data), update db, return new job data.
   *
   * data should be { title, salary, equity, companyHandle }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * */

  static async create(data) {

    const result = await db.query(
          `INSERT INTO jobs
           (title, salary, equity, company_handle)
           VALUES ($1, $2, $3, $4)
           RETURNING id, title, salary, equity, company_handle AS "companyHandle"`,
        [
            data.title, 
            data.salary, 
            data.equity, 
            data.companyHandle
        ]
    );
    let job = result.rows[0];

    return job;
  }

  /** Find all jobs
   *
   * Returns [{ id, title, salary, equity, companyHandle}, ...]
   * */

  static async findAll() {
    const jobsRes = await db.query(
          `SELECT id,
                  title,
                  salary,
                  equity,
                  company_handle AS "companyHandle"
           FROM jobs
           ORDER BY title`);
  
    return jobsRes.rows;
  }

  /** Get a list of filtered jobs
   * 
   * Accepts Object with filter parameters for title, hasEquity, minSalary
   * 
   * Example: GET /job?minSalary=500/ 
   * @param filterBy = {minSalary: 500}
   * 
   * Returns [{ handle, name, description, numEmployees, logoUrl }, ...]
   */

  static async findFiltered(filterBy) {
    
    const keys = Object.keys(filterBy);

    if (keys.length === 0) throw new BadRequestError("No data to filter by");



    const whereQuery = keys.map(condition => {
      switch (condition) {
        case 'minSalary':
          const minSalary = Number(filterBy[condition]);
          if (isNaN(minSalary)) {
            throw new BadRequestError("minSalary must be a number.");
          }
          return `salary >= ${minSalary}`;

        // hasEquity: if true, filter to jobs that provide a non-zero amount of equity. 
        // If false or not included in the filtering, list all jobs regardless of equity.
        case 'hasEquity':
          const hasEquity = filterBy[condition];
          if (hasEquity === true) {
            return `equity > 0`;
          }
          
        case 'title':
          return `LOWER(title) LIKE '%${filterBy[condition].toLowerCase()}%'`;
        default:
          throw new BadRequestError(`Invalid filter key: ${condition}`);
      }
    });
    
    
    const whereClause = whereQuery.join(' AND ')
    const jobsRes = await db.query(
          `SELECT id,
                    title,
                    salary,
                    equity,
                    company_handle AS "companyHandle"
            FROM jobs
            WHERE ${whereClause}
            ORDER BY title`);
    if (!jobsRes.rows) throw new BadRequestError("Filtering error, please double check that all filters are populated.")
    return jobsRes.rows;
  }

  /** Given a job id, return data about job.
   *
   * Returns { id, title, salary, equity, companyHandle}

   *
   * Throws NotFoundError if not found.
   **/

  static async get(id) {
    const jobRes = await db.query(
          `SELECT id,
            title,
            salary,
            equity,
            company_handle AS "companyHandle"
            FROM jobs
            WHERE id = $1`,
        [id]);

    const job = jobRes.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    const companiesRes = await db.query(
        `SELECT handle,
                name,
                description,
                num_employees AS "numEmployees",
                logo_url AS "logoUrl"
        FROM companies
        WHERE handle = $1`, [job.companyHandle]);

    delete job.companyHandle;
    job.company = companiesRes.rows[0];

    return job;
  }

  /** Update job data with `data`.
   *
   * This is a "partial update" --- it's fine if data doesn't contain all the
   * fields; this only changes provided ones.
   *
   * Data can include: { title, salary, equity }
   *
   * Returns { id, title, salary, equity, companyHandle }
   *
   * Throws NotFoundError if not found.
   */

  static async update(id, data) {
    const { setCols, values } = sqlForPartialUpdate(
        data,
        {});
    const idVarIdx = "$" + (values.length + 1);

    const querySql = `UPDATE jobs
                      SET ${setCols} 
                      WHERE id = ${idVarIdx} 
                      RETURNING id, 
                                title, 
                                salary, 
                                equity,
                                company_handle AS "companyHandle"`;
    const result = await db.query(querySql, [...values, id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);

    return job;
  }

  /** Delete given job from database; returns undefined.
   *
   * Throws NotFoundError if job not found.
   **/

  static async remove(id) {
    const result = await db.query(
          `DELETE
           FROM jobs
           WHERE id = $1
           RETURNING id`,
        [id]);
    const job = result.rows[0];

    if (!job) throw new NotFoundError(`No job with id: ${id}`);
  }
}


module.exports = Job;
