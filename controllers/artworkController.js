const multer = require('multer');
const sharp = require('sharp');
const Hashids = require('hashids/cjs');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const factory = require('./../controllers/handlerFactory');
const Artwork = require('./../models/artworkModel');

// dirname is where current script is located, so that is main folder
// parse JSON to js obj
// const artworks = JSON.parse(
//   fs.readFileSync(`${__dirname}/../dev-data/data/artworks-simple.json`)
// );

// Diskstorage engine give u full control on storing files to disk
// const multerStorage = multer.diskStorage({
//   // has access our req, uploaded file and a callback
//   destination: (req, file, cb) => {
//     cb(null, 'public/img/artworks');
//   },
//   filename: (req, file, cb) => {
//     const ext = file.mimetype.split('/')[1];
//     // name = user-'id'-'timestamp'
//     cb(null, `user-${req.user.id}-${Date.now()}.${ext}`);
//   }
// });

// image will be stored in memory as buffer
const multerStorage = multer.memoryStorage();

// to test uploaded file is img
const multerFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    console.log(222, req.body, req.files);
    cb(new AppError('Not an image! Please upload only images'), false);
  }
};

// if we dont provide destination, files will only save on memory
const upload = multer({ storage: multerStorage, fileFilter: multerFilter });

exports.uploadPhotos = upload.fields([
  { name: 'thumbnailFile', maxCount: 1 },
  { name: 'artworkFiles', maxCount: 3 }
]);

exports.resizeImage = (req, res, next) => {
  if (!req.files) return next();

  // we store our image in memory to resize and then save it in our project
  // other middleware still need image name, so we passed here
  // resize the image from buffer and store it into our file destination
  if (req.files.thumbnailFile[0]) {
    req.files.thumbnailFile[0].filename = `tn-${
      req.user.id
    }-${Date.now()}.jpeg`;
    sharp(req.files.thumbnailFile[0].buffer)
      .resize({
        width: 600,
        height: 400
      })
      // .flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } })
      .toFormat('jpeg')
      .jpeg({ quality: 100 })
      .toFile(`public/img/artworks/${req.files.thumbnailFile[0].filename}`);
  }

  if (req.files.artworkFiles.length > 0) {
    req.files.artworkFiles.forEach((file, i) => {
      req.files.artworkFiles[i].filename = `asset-${i}-${
        req.user.id
      }-${Date.now()}.jpeg`;
      // console.log(i, req.files.artworkFiles[i].filename);
      sharp(req.files.artworkFiles[i].buffer)
        .resize({
          // width: 1000
          width: null,
          height: null
        })
        // .flatten({ background: { r: 255, g: 255, b: 255, alpha: 255 } })
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(`public/img/artworks/${req.files.artworkFiles[i].filename}`);
    });
  }

  next();
};

exports.aliasTopArtwork = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage';
  req.query.fields = 'name,price,ratingsAverage';
  next();
};

exports.getAllArtworks = factory.getAll(Artwork, {
  path: 'user',
  select: 'name photo'
});

exports.getArtwork = factory.getOne(Artwork, { path: 'reviews user' }, 'hash');

// exports.createArtwork = factory.createOne(Artwork);
exports.createArtwork = catchAsync(async (req, res, next) => {
  // if (req.files) {
  //   if (req.files.thumbnailFile[0])
  //     req.body.thumbnailFile = req.files.thumbnailFile[0].filename;

  //   if (req.files.artworkFiles.length > 0) {
  //     // eslint-disable-next-line prefer-const
  //     let arr = [];
  //     req.files.artworkFiles.forEach((_, i) => {
  //       arr.push(req.files.artworkFiles[i].filename);
  //     });
  //     req.body.artworkFiles = arr;
  //   }
  // }
  const hashids = new Hashids(`${req.body.user}${Date.now()}`, 10);

  req.body.hashId = hashids.encode(1, 2, 3);

  const doc = await Artwork.create(req.body);

  res.status(200).json({
    status: 'success',
    data: {
      data: doc
    }
  });
});

exports.updateArtwork = factory.updateOne(Artwork);

exports.deleteArtwork = factory.deleteOne(Artwork);

exports.getArtworkStats = catchAsync(async (req, res, next) => {
  // aggregation pipeline is a bit like regular query that can manipulate data in different steps
  // documents pass through different stages
  const stats = await Artwork.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } }
    },
    {
      $group: {
        // _id: '$ratingsAverage',
        _id: '$category',
        numArtworks: { $sum: 1 },
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' },
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' }
      }
    },
    {
      $sort: {
        avgPrice: 1
      }
    }
    // {
    //   $match: { _id: { $ne: 'crime' } }
    // }
  ]);

  res.status(200).json({
    status: 'success',
    results: stats.length,
    data: {
      stats
    }
  });
});
