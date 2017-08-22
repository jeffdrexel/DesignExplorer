# DesignExplorer

Below we detail the process of how we are expecting your data to come into Design Explorer successfully.

## Prepare CSV Record

Field|Description
---|---
`name` | Name of design space. this can be the same for all iterations
`img` | File path of option image beginning from the data folder.
`threeD` | File Path of option Json formatted 3D model.
`in:---` | input value
`out:---` | output value

name|img|threeD|in:Iteration|in:Rotation|in:Len X|in: Len Y|in:Separation|out: Average Daylight Hours
---|---|---|---|---|---|---|---|---
ExampleDataSpace|images/image_00000.png|json/00000.json|0|0|65|25|5|2.808041
ExampleDataSpace|images/image_00001.png|json/00001.json|1|0.785398|65|25|5|2.424112
ExampleDataSpace|images/image_00002.png|json/00002.json|2|0.5 * Pi|65|25|5|2.620045
ExampleDataSpace|images/image_00003.png|json/00003.json|3|2.356194|65|25|5|2.420144
ExampleDataSpace|images/image_00004.png|json/00004.json|4|Pi|65|25|5|2.808041
ExampleDataSpace|images/image_00005.png|json/00005.json|5|3.926991|65|25|5|2.424112
ExampleDataSpace|images/image_00006.png|json/00006.json|6|1.5 * Pi|65|25|5|2.620045
ExampleDataSpace|images/image_00007.png|json/00007.json|7|5.497787|65|25|5|2.420144
...|...|...|...|...|...|...|...|...

## Prepare all data and upload

Check to make sure you have outputs from GH:

- YourCSVName.csv
- Images
- Json files

### Create options.json

The first file that the Design Explorer interface will read is `options.json`.

This file will contain information on what data to display, and how we want it to be displayed. An example of its content is found below:

````json
{
  "dataUrl": "YourCSVName.csv",
  "defaultSortKey": "out: Average Daylight Hours",
  "hiddenKeys": [
    "in:Iteration"
  ],
  "thumbKeys":[
    "in:Rotation",
    "in: Len X",
    "in: Len Y",
    "in: Num Separation"
  ],
  "maxThumbCols":6,
  "showThumbValueLabels":true,
  "useThumbUrls":false,
  "resultIconLimit":100
}
````

#### Explanation of options

Option  | Description
--      | --
`dataUrl` | URL of the CSV within our upload folder
`defaultSortKey` | The key (aka column name) that the data will sort by when it first loads.
`hiddenKeys`  | Keys in the CSV that will hide in the parallel coordinates chart by default
`thumbKeys` | The keys that will show below the thumbnail images in thumbnail view. You can leave this blank if you don't want to see those values below.
`maxThumbCols` | The maximum number of columns of thumbnails to see (affects minimum thumbnail size dependent on the screen size we are viewing this from)
`showThumbValueLabels` | Whether to show the sort values on the thumbnails
`useThumbUrls` | Whether to use separate urls for thumbnails. If you're experiencing long load times, you can upload a separate set of low-resolution images to use as thumbnails with the format `imageName_thumb.jpg/png/gif`. Make sure they have the same extension as your default images. When you upload them, make sure they live in the same folder as your normal images.
`resultIconLimit` | How many result icons to show maximum. This will drastically improve browser responsiveness and loading speed when you have a lot of options to show.


## Upload to Amazon S3 Hosted Site

- Open AWS S3 Console and navigate to the bucket which hosts the page (should be `kpfui-de`).

- Under the `data` folder, create a new folder with the name of your design space. Use a URL-friendly name (alphanumeric characters, no whitespace or special characters other than hyphens or underscores).

- Upload your data to the bucket. Your design space folder structure should look like this:

```
design-space-name
│   options.json
│   YourCSVName.csv   
│
└───images
│   │   image_00000.png
│   │   image_000001.png
│   │   etc
│   
└───json
    │   00000.json
    │   000001.json
    │   etc
```

- Make sure your uploaded folder and files are public. This was an option during the upload process. If you missed it there, you can also right-click on your design space folder name in S3 on the web and make it public from there.


## Accessing your project

To access your new data set, you would use:

`http://kpfui-de.s3-website-us-east-1.amazonaws.com/#!/?set=[design-space-name]`
