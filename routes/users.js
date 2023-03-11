const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const saltRounds = 10;


const {db} = require('../Mongo');
const {uuid} = require('uuidv4');
const {validateUser} = require('../validation/user');

const User = () => db().collection('users');
/* GET users listing. */
router.get('/', function (req, res, next) {
    res.send('respond with a resource');
});

// create user
router.post('/register', async (req, res) => {
    // create user object
    let hashed;
    const userObj = {
        email: req.body.email,
        password: req.body.password,
        verify: req.body.verify
    }
    // validate userObject
    const validated = validateUser(userObj);
    if (!validated.isValid) {
        return res.status(500).json({
            success: false,
            error: validated.errors
        })
    }

    try {
        // check for existing user
        const userFound = await User().findOne({email: userObj.email});
        if (userFound !== null) {
            return res.status(400).json({
                success: false,
                message: "Email already exists, please try another email"
            })
        }
        // hash the password
        hashed = await bcrypt.hash(userObj.password, saltRounds);
        // set userObj.password and userObj.verify to hashed
        userObj.password = hashed;
        userObj.verify = hashed;
        // Insert the user into the database
        User().insertOne({
            _id: uuid(),
            email: userObj.email,
            password: userObj.password
        }).then(async result => {
            const newUser = await User().findOne({_id: result.insertedId});
            return res.status(200).json({
                success: true,
                data: newUser
            })
        })
    } catch (err) {
        return res.status(500).json({
            success: false,
            error: err.message
        })
    }
})

// get user by id
router.get('/:id', async (req, res)=>{
    const foundUser = await User().findOne({_id: req.params.id});
    if(foundUser === null){
        return res.status(400).json({
            success: false,
            message: "This user does not exist."
        })
    }
    return res.status(200).json({
        success: true,
        user: foundUser
    })
})

// login user
router.post('/login', async (req, res)=>{
    const errors = [];

    // check for existing user
    const foundUser = await User().findOne({email: req.body.email});
    if(foundUser === null){
        errors.push({
            type: "user",
            message: "user does not exist."
        })
        return res.status(400).json({
            success: false,
            error: errors
        })
    }
    const userData = {
        _id: foundUser._id,
        email: foundUser.email
    }

    try{
        bcrypt.compare(req.body.password, foundUser.password)
            .then(result=>{
                if(result === true){
                    return res.status(200).json({
                        success: true,
                        data: userData
                    })
                }else{
                    errors.push({
                        type: "user",
                        message: "email or password invalid"
                    })
                }
                return res.status(500).json({
                    success: false,
                    error: errors
                })
            })
    }catch(err){
        res.status(500).json({
            success: false,
            error: err.message
        })
    }
})
module.exports = router;
