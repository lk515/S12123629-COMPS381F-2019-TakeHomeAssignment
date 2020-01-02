const express = require('express');
const app = express();
const formidable = require('formidable');
const ExifImage = require('exif').ExifImage;
const fs = require('fs');

var photo = {};
var gps = {};

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
	res.status(200).render('upload.ejs');
});

app.post('/upload', (req,res) => {
	const form = new formidable.IncomingForm();
	form.parse(req, (err,fields,files) => {
		if (fields.title == ""){
			res.status(500).end("Please enter the title!")
		}else if (files.filetoupload.name == "") {
			res.status(500).end("No photo is selected!");
        	}
		photo['title'] = fields.title;
		photo['description'] = fields.description;
		try {
			new ExifImage({image:files.filetoupload.path},(error, exifData) => {
				if (error) {
					res.status(500).end('EXIF Data Error!');
				} else {
					photo['make'] = exifData.image.Make;
					photo['model'] = exifData.image.Model;
					photo['createdate'] = exifData.exif.CreateDate;
					if (exifData.gps.GPSLatitudeRef == 'S'){
						gps['latitude'] = -(exifData.gps.GPSLatitude[0] + (exifData.gps.GPSLatitude[1] / 60) + (exifData.gps.GPSLatitude[2] / 3600));
					}else if (exifData.gps.GPSLatitudeRef == 'N'){
						gps['latitude'] = (exifData.gps.GPSLatitude[0] + (exifData.gps.GPSLatitude[1] / 60) + (exifData.gps.GPSLatitude[2] / 3600));
					}else{
						gps['latitude'] = null;
					}
					if (exifData.gps.GPSLongitudeRef == 'W'){
						gps['longitude'] = -(exifData.gps.GPSLongitude[0] + (exifData.gps.GPSLongitude[1] / 60) + (exifData.gps.GPSLongitude[2] / 3600));
					}else if (exifData.gps.GPSLongitudeRef == 'E'){
						gps['longitude'] = (exifData.gps.GPSLongitude[0] + (exifData.gps.GPSLongitude[1] / 60) + (exifData.gps.GPSLongitude[2] / 3600));
					}else{
						gps['longitude'] = null;
					}
					gps['zoom'] = 12;
					fs.readFile(files.filetoupload.path, (err,data) => {
						photo['photo'] = new Buffer.from(data).toString('base64');
						photo['phototype'] = files.filetoupload.type;
						res.redirect('/photo');
					});
				}
			});
		} catch (error) {
			res.status(500).end('Error!');
		}
	});
});

app.get('/photo', (req,res) => {
	res.status(200).render('photo.ejs', {photo:photo});
});

app.get('/map', (req,res) => {
	res.status(200).render('map.ejs', {gps:gps});
});

const PORT = process.env.PORT || 8099;
app.listen(PORT, console.log(`Server started on port ${PORT}`));

