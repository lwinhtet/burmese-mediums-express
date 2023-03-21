const mongoose = require('mongoose');
const Artwork = require('./artworkModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
      required: [true, 'Review can not be empty!']
    },
    rating: {
      type: Number,
      max: 5,
      min: 1
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    artwork: {
      type: mongoose.Schema.ObjectId,
      ref: 'Artwork',
      required: [true, 'Review must belong to a artwork.']
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user']
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// create index
// each combination of artwork and user has always be unique
reviewSchema.index({ artwork: 1, user: 1 }, { unique: true });

// we need to call this.aggregate on the model directly that why we are using static
// bec in static 'this' points to current model
reviewSchema.statics.calcAverageRatings = async function(artworkId) {
  const stats = await this.aggregate([
    // first filter
    {
      $match: { artwork: artworkId }
    },
    // let calculate
    {
      $group: {
        _id: '$artwork',
        numOfRating: { $sum: 1 },
        avgRating: { $avg: '$rating' }
      }
    }
  ]);

  if (stats.length > 0) {
    await Artwork.findByIdAndUpdate(artworkId, {
      ratingsQuantity: stats[0].numOfRating,
      ratingsAverage: stats[0].avgRating
    });
  } else {
    await Artwork.findByIdAndUpdate(artworkId, {
      ratingsQuantity: 0,
      ratingsAverage: 4.5
    });
  }
};

reviewSchema.post('save', function() {
  // 'this' point to the doc
  // 'constructor' point to the model who created the doc
  // we use this.constructor because Review model is still not init/created
  this.constructor.calcAverageRatings(this.artwork);
});

// findByIdAndUpdate
// findByIdAndDelete
// using calcAverageRatings in update and delete for review (query middleware)
reviewSchema.pre(/^findOneAnd/, async function(next) {
  // a trick basiclly to pass data from pre to post instead of saving to variable
  // we gonna save it to this.r
  this.r = await this.findOne();
  next();
});
reviewSchema.post(/^findOneAnd/, async function() {
  // await this.findOne(); does not work here, query has already executed
  // after review has been updated, now we can call calcAverageRatings, we needed pre
  // so that we can access recent doc bec we are in query middleware
  await this.r.constructor.calcAverageRatings(this.r.artwork);
});

reviewSchema.pre(/^find/, function(next) {
  // this.populate({
  //   path: 'artwork',
  //   select: 'name assets'
  // }).populate({
  //   path: 'user',
  //   select: 'name photo'
  // });
  this.populate({
    path: 'user',
    select: 'name photo'
  });
  next();
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
