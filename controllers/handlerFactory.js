const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const APIFeatures = require('../utils/apiFeatures');
const {
  revalidateArtworkPage,
  revalidatePortfolioPage
} = require('../utils/revalidateSSG');

exports.getAll = (Model, popOptions) =>
  catchAsync(async (req, res, next) => {
    // to allow for nested GET reviews on artworks
    let filter;
    if (req.params.artworkId) filter = { artwork: req.params.artworkId };
    // keep adding methods by using APIfeatures until we get our final query
    const features = new APIFeatures(Model.find(filter), req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    let doc = features.query;
    if (popOptions) doc = doc.populate(popOptions);
    const data = await doc;

    res.status(200).json({
      status: 'success',
      results: data.length,
      data: {
        data
      }
    });
  });

exports.getOne = (Model, popOptions, findBy = null) =>
  catchAsync(async (req, res, next) => {
    let query;
    if (findBy === 'hash') {
      query = Model.findOne({ hashId: req.params.id });
    } else if (findBy === 'slug') {
      query = Model.findOne({ slug: req.params.id });
    } else {
      query = Model.findById(req.params.id);
    }

    if (popOptions) query = query.populate(popOptions);
    const doc = await query;
    if (!doc) {
      return next(new AppError('No Item found with that ID', 404));
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

// exports.getOneByHash = (Model, popOptions) =>
//   catchAsync(async (req, res, next) => {
//     console.log(111, req.params);
//     let query = Model.find({ hashId: req.params.id });
//     if (popOptions) query = query.populate(popOptions);
//     const doc = await query;
//     if (!doc) {
//       return next(new AppError('No Item found with that ID', 404));
//     }

//     res.status(200).json({
//       status: 'success',
//       data: {
//         data: doc
//       }
//     });
//   });

exports.createOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.create(req.body);

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.updateOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!doc) {
      return next(new AppError('No Artwork found with that ID', 404));
    }

    if (Model.modelName === 'Artwork') {
      revalidateArtworkPage(doc.hashId);
      revalidatePortfolioPage(req.user.slug);
    }

    res.status(200).json({
      status: 'success',
      data: {
        data: doc
      }
    });
  });

exports.deleteOne = Model =>
  catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
      return next(new AppError('No Item found with that ID', 404));
    }
    res.status(204).json({
      status: 'success'
    });
  });
