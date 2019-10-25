const ErrorResponse = require('../util/errorResponse');
const asyncHandler = require('../middleware/async');
const geocoder = require('../util/geocoder');
const Bootcamp = require('../models/Bootcamp');

// @desc    Get all botcamps
// @route   GET /api/v1/bootcamps
// @access  public
exports.getBootcamps = asyncHandler(async (req, res, next) => {
    let query;
    let reqQuery = {...req.query};

    // Fields to exclude
    const removeFields = ['select', 'sort'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    let queryStr = JSON.stringify(reqQuery);

    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, math => `$${math}`);
    query = Bootcamp.find(JSON.parse(queryStr));

    // Select Fields
    if (req.query.select) {
        const fields = req.query.select.split(',').join(' ');
        query = query.select(fields);
    }

    // Sort Fields
    if (req.query.sort) {
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    } else {
        query = query.sort('-createdAt');
    }

    const bootcamps = await query;

    res.status(200).json({success: true, count: bootcamps.length, data: bootcamps})
});

// @desc    Get single botcamp
// @route   GET /api/v1/bootcamps/:id
// @access  public
exports.getBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findById(req.params.id);

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of: ${req.params.id}`, 404));
    }

    res.status(200).json({success: true, data: bootcamp})
});

// @desc    Create new bootcsmp
// @route   POST /api/v1/bootcamps
// @access  private
exports.createBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.create(req.body);

    res.status(201).json({
        success: true,
        data: bootcamp
    })
});

// @desc    Update bootcsmp
// @route   PUT /api/v1/bootcamps/:id
// @access  private
exports.updateBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of: ${req.params.id}`, 404));
    }

    res.status(200).json({success: true, data: bootcamp});
});

// @desc    Delete bootcsmp
// @route   DELETE /api/v1/bootcamps/:id
// @access  private
exports.deleteBootcamp = asyncHandler(async (req, res, next) => {
    const bootcamp = await Bootcamp.findByIdAndDelete(req.params.id);

    if (!bootcamp) {
        return next(new ErrorResponse(`Bootcamp not found with id of: ${req.params.id}`, 404));
    }

    res.status(200).json({success: true, data: {}});
});

// @desc    Get bootcamps within a radius
// @route   GET /api/v1/bootcamps/radius/:zipcode/:distance
// @access  private
exports.getBootcampsInRadius = asyncHandler(async (req, res, next) => {
    const {zipcode, distance} = req.params;

    //Get lat/lng from geocoder
    const loc = await geocoder.geocode(zipcode);
    const lat = loc[0].latitude;
    const lng = loc[0].longitude;

    // Calc radius using radians
    // Divide distance by radius of Earth
    // Earth Radius = 3,963 mi OR 6,378 km
    const radius = distance / 6378;

    const bootcamps = await Bootcamp.find({
        location: {$geoWithin: {$centerSphere: [[lng, lat], radius]}}
    });

    res.status(200).json({
        success: true,
        count: bootcamps.length,
        data: bootcamps
    })
});
