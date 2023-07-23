const mongoose = require('mongoose');
// const validator = require('validator');

const arrayValidator = val => Array.isArray(val) && val.length > 0;

const artworkSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'An artwork must have a title'],
      trim: true,
      maxlength: [40, 'Name must have less or equal than 40 characters'],
      minlength: [1, 'Name must have more or equal than 1 characters']
    },
    hashId: String,
    artworkFiles: {
      type: [String],
      validate: {
        validator: arrayValidator,
        message: 'At least one artwork is required!'
      }
    },
    thumbnailFile: {
      type: String,
      required: [true, 'Thumbnail file is required!']
    },
    topics: {
      type: [String]
    },
    mediums: {
      type: [String]
    },
    softwares: {
      type: [String]
    },
    tags: {
      type: [String]
    },
    description: {
      type: String,
      trim: true
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    isPublic: {
      type: Boolean,
      default: 'true'
    },
    // ratingsAverage: {
    //   type: Number,
    //   default: 4.5,
    //   min: [1, 'Rating must be above 1.0'],
    //   max: [5, 'Rating must be below 5.0'],
    //   // setter function (will run each time a new val is set)
    //   set: val => Math.round(val * 10) / 10 // 4.66666 46.6666 47 4.7
    // },
    // ratingsQuantity: {
    //   type: Number,
    //   default: 0
    // },
    // price: {
    //   type: Number
    //   // required: [true, 'An artwork must have a price']
    // },
    // priceDiscount: {
    //   type: Number,
    //   validate: {
    //     validator: function(val) {
    //       // 'this' only points to current doc on new doc creation, not gonna work on update
    //       return val < this.price;
    //     },
    //     message: 'Discount price ({VALUE}) should be below regular price'
    //   }
    // },
    postedAt: {
      type: Date,
      default: Date.now()
      // select: false
    },
    createdAt: {
      type: Date,
      default: Date.now()
      // select: false
    },
    updatedAt: {
      type: Date,
      default: Date.now()
    }
  },
  {
    // if data is output as JSON or Obj, virtuals properties will be part of the data
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// artworkSchema
//   .path('assets')
//   .validate(arrayValidator, 'At least one asset is required!');

// artworkSchema
//   .path('categories')
//   .validate(arrayValidator, 'At least one category is required!');

// asc order
/* we ordered our list ascending by price, so instead of examining all doc 
we have a sorted list of artwork by price. So we can query much faster */
/* how to identify which field need to index
-> we need to know which fields are queried the most 
-> each index actually uses resources, also each index needs to be updated each
time that underlying collection is updated. So if you have a collection with a 
high write-read ratio, it would make no sence to create an index on any field in
the collection bec the cost of always updating the index and keeping it in memory
outweighs the benefit of having the index in the first place if we rarely have searches
*/
// artworkSchema.index({ slug: 1 });
// artworkSchema.index({ price: 1, ratingsAverage: -1 });
artworkSchema.index({ createdAt: 1 });

// virtual populate
artworkSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'artwork',
  localField: '_id'
});

// Document middleware
// artworkSchema.pre('save', function(next) {
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });

// artworkSchema.post('save', function(doc, next) {
//   next();
// });

// Query Middleware
// excuted after query is finished, 'this' keyword point to query
artworkSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'users',
  //   select: '-__v -passwordChangedAt'
  // });
  next();
});

const Artwork = mongoose.model('Artwork', artworkSchema);

module.exports = Artwork;
