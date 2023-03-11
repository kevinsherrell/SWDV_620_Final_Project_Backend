/*
* Favorite:
* Title
* imdbID
* Type
* Poster
* Rating
*
*
* */
const express = require('express');
const router = express.Router();
const {uuid} = require('uuidv4')

const {db} = require('../Mongo');

const Favorite = () => db().collection('favorites');
// get all favorites belonging to user id
router.get('/:userId', async (req, res) => {
    console.log("find all favorites");
    const favoriteList = [];
    const foundFavorite = await Favorite().find({userID: req.params.userId});

    if (foundFavorite !== null) {
         await foundFavorite.forEach(favorite => {
            favoriteList.push(favorite);
            console.log("Hello");
        })
        return res.status(200).json({
            success: true,
            data: favoriteList
        })
    }
    return res.status(500).json({
        success: false,
        message: "Favorite not found"
    })
})
// post new favorite
router.post("/create", async (req, res) => {
    let favorite = {
        _id: uuid(),
        userID: req.body.userID,
        Title: req.body.Title,
        imdbID: req.body.imdbID,
        Type: req.body.Type,
        Year: req.body.Year,
        Poster: req.body.Poster,
        Rating: req.body.Rating || null
    }
    console.log("Favorite", favorite);
    Favorite().insertOne(favorite)
        .then(result => {
            return res.status(200).json({
                success: true,
                data: favorite
            })
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                message: err.message
            })
        })


})
// delete favorite
router.delete("/delete/:id", (req, res) => {
    Favorite().findOneAndDelete({_id: req.params.id})
        .then(result => {
            res.status(200).json({
                success: true,
                result: result
            })
        })
        .catch(err => {
            res.status(500).json({
                success: false,
                message: err.message
            })
        })
})
// update favorite
router.put('/update/:favId', async (req, res) => {
    try {
        if (Object.keys(req.body).length === 0) {
            return res.status(500).json({
                success: false,
                error: "Body is empty, no changes have been made"
            })
        }

        const updateFavorite = await Favorite().updateOne({_id: req.params.favId}, {$set: req.body}, {upsert: false});
        const favorite = await Favorite().findOne({_id: req.params.favId});
        return res.status(200).json({
            success: true,
            data: favorite
        })
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        })
    }
})

module.exports = router;