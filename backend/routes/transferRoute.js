const express = require('express');
const jwt = require('jsonwebtoken');

const router = express.Router();

// import user model here
const User = require('../models/user');
const TransferFund = require('../models/fundTransfer');

const mongoose = require('mongoose');

//const db = "mongodb+srv://bank_user:rWKBghDmKHhryTPY@cluster0.b8zfxbx.mongodb.net/bnk_appDB?retryWrites=true&w=majority";
const db = "mongodb://localhost:27017/bank_appdb";
mongoose.set('strictQuery', false); // this is to suppress some db error

// db connection here
mongoose.connect(db, err =>{
    if(err){
        console.error('Error ' + err);
    } else{
        console.log('database connected to mongodb')
    }
});

// fund transfer
router.post('/sendfund', async(req, res) =>{
    let fundData = req.body;
    const userId = req.body.createdBy;
    const amt_send = req.body.amount;
    let fundsend = new TransferFund(fundData);
    try {
    // let sendFund;
     let userDetails = await User.findOne({_id: userId}); // where I am checking if user exist the I will get user details
      //  console.log(`${userDetails.name}`); // is showing undefine.
   
     if(!userDetails){
        res.status(402).send({msg: '402'});
        console.log('User not fund!'); // user account not found then show error
     }
     else if(userDetails.acct_status == 'Pending' || userDetails.acct_status == null){
        res.status(403).send({msg: '403'});
       // user account status is not active
     }
     else if(userDetails.amount == '' || userDetails.amount < amt_send ){
        res.status(405).send({msg: '405'}); // user account balance is low
     }

    else if(userDetails){
        sendFund = await fundsend.save();
        res.status(200).send({msg: '200', sendFund});

     }
  
    //fundsend.createdBy = (User._id); // get current user ID
    } catch (err) {
        res.status(500).send({msg: '500'})
    }
    });

    // fund pin transfer validation here
router.post('/pin', async(req, res) =>{
        let acct_pin = req.body.acct_pin;
        const userId = req.body.createdBy;
        try {
        // get the transfer record ID here
        const filter = { tid: req.body.tran_id };
        
         let userDetails = await User.findOne({_id: userId}); // here I am checking if user exist then I will get user details
         
         if(!userDetails){
            res.status(402).send({msg: '402'});
            // user account not found then show error
         }
         else if(req.body.acct_pin == '' || req.body.acct_pin == null){
            res.status(404).send({msg: '404'}); // cot code reguired
            console.log('fields required')
         }
         else if(userDetails.acct_status == 'Pending' || userDetails.acct_status == null){
            res.status(403).send({msg: '403'});
           // user account status is not active
         }
         else if(userDetails.acct_pin == '' || userDetails.acct_pin == null ){
            res.status(204).send({msg: '204'}); // user account pin not found
         }
         else if(userDetails.acct_pin != acct_pin ){
            res.status(406).send({msg: '406'}); // invalid pin entered
         }
        else if(userDetails.acct_pin == acct_pin){
        //update single record transfer status collection here
         const updateDoc = {
            $set: {
                transaction_status: 'Pin validated'
            },
          };
          const result = await TransferFund.updateOne(filter, updateDoc);
            res.status(200).send({msg: '200'});
         }
      
        //console.log(req.body);
        //fundsend.createdBy = (User._id); // get current user ID
        } catch (err) {
            res.status(500).send({msg: '500'})
        }
    });

    // fund cot code transfer validation here
router.post('/cot', async(req, res) =>{
    let cot_code = req.body.cot;
    const userId = req.body.createdBy;
    try {
    // get the transfer record ID here
    const filter = { tid: req.body.tran_id };
   
     let userDetails = await User.findOne({_id: userId}); // here I am checking if user exist then I will get user details
     if(!userDetails){
        res.status(402).send({msg: '402'});
        // user account not found then show error
     }
     else if(userDetails.acct_status == 'Pending' || userDetails.acct_status == null){
        res.status(403).send({msg: '403'});
       // user account status is not active
     }
     else if(userDetails.acct_cot == '' || userDetails.acct_cot == null ){
        res.status(401).send({msg: '401'}); // user account pin not found
     }
    else if(req.body.cot == '' || req.body.cot == null){
        res.status(404).send({msg: '404'}); // cot code reguired
        console.log('fields required')
     }
     else if(userDetails.acct_cot != cot_code ){
        res.status(406).send({msg: '406'}); // invalid pin entered
     }
    else if(userDetails.acct_cot == cot_code){
        //update single record transfer status collection here
        const updateDoc = {
            $set: {
                transaction_status: 'COT validated'
            },
          };
          const result = await TransferFund.updateOne(filter, updateDoc);

        res.status(200).send({msg: '200'});
    }
    } catch (err) {
        res.status(500).send({msg: '500'})
    }
});

    // fund imf code transfer validation here
router.post('/imf', async(req, res) =>{
        let acct_imf = req.body.acct_imf;
        const userId = req.body.createdBy;
        try {
        const filterUser = {_id: req.body.createdBy};// get current user ID here from request send
        
        const filter = { tid: req.body.tran_id }; // get the transfer record ID here
        let tranAmount = await TransferFund.findOne({tid: req.body.tran_id})// get the amount transfer from transfer table
        let userDetails = await User.findOne({_id: userId}); // here I am checking if user exist then I will get user details
         
        const curBalance = (userDetails.amount - tranAmount.amount); // remove amount send from user current balance

        if(!userDetails){
            res.status(402).send({msg: '402'});
            // user account not found then show error
         }
         else if(userDetails.acct_status == 'Pending' || userDetails.acct_status == null){
            res.status(403).send({msg: '403'});
           // user account status is not active
         }
         else if(req.body.acct_imf == '' || req.body.acct_imf == null){
            res.status(404).send({msg: '404'}); // imf code reguired
         }
         else if(userDetails.acct_imf_code == '' || userDetails.acct_imf_code == null ){
            res.status(401).send({msg: '401'}); // user account imf not found
         }
        
         else if(userDetails.acct_imf_code != acct_imf ){
            res.status(406).send({msg: '406'}); // invalid imf entered
         }
        else if(userDetails.acct_imf_code == acct_imf){
            // update transfer status table to be successful
            const updateDoc = {
            $set: {
                transaction_status: 'Successful',
                tran_type: 'Transfer',
                transac_nature: 'Debit',
                tran_desc: 'Fund transfer',
                trans_balance: curBalance
            },
          };
          const result = await TransferFund.updateOne(filter, updateDoc);
           
          // update user current balance here
           const updateDocBalance = {
            $set: {
                amount: curBalance,
                last_transaction: tranAmount.amount
            },
          };
          const result_bal = await User.updateOne(filterUser, updateDocBalance);
            res.status(200).send({msg: '200'});// send success respond here
        }
        } catch (err) {
            res.status(500).send({msg: '500'})
        }
    });

module.exports = router;