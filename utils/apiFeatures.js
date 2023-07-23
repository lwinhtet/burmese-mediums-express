class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // ES6 destructuring for creating new obj
    // bec in js, new variable will just be a reference to that original obj.
    // if we delete queryObj, original val will be deleted too, that we need to create new
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    // we use delete operator (queryObj['page'])
    excludedFields.forEach(el => delete queryObj[el]);

    const filterFields = ['topics', 'softwares', 'mediums'];
    filterFields.forEach(field => {
      if (queryObj[field]) {
        const arr = queryObj[field].split(',');
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < arr.length; i++) {
          arr[i] = +arr[i];
        }
        // { quantity: { $in: [ 5, 15 ] } }
        queryObj[field] = { $in: arr };
      }
    });

    let queryStr = JSON.stringify(queryObj);
    // gt, gte, lt, lte
    // we used regexp, \b is for exact word not for (eg. filter, lt), g for do multiple time
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    // this is entire obj, then we can chain another methods
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // sort('price ratingsAverage')
      let sortBy = this.queryString.sort.split(',').join(' ');
      if (sortBy === 'latest') sortBy = { createdAt: -1 };
      if (sortBy === 'oldest') sortBy = { createdAt: 1 };
      this.query = this.query.sort(sortBy);
    } else {
      // * createdAt can be at the same time, so if date is same, sort with id
      this.query = this.query.sort({ createdAt: -1, _id: 1 });
    }
    return this;
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }
    return this;
  }

  paginate() {
    // we want to skip x results before we query
    // 1-10 , 11-20
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;
    this.query = this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = APIFeatures;
