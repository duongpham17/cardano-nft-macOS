import fs from 'fs';
import path from 'path';

interface Layer {
    name: string,
    location: string,
    elements: string[]
};

// Set a width and height for the canvas
const [width, height] = [2048, 2048];

//returns array of objects containing all the unique layers 
const getAllElements = (pathname: string): Layer["elements"] => {

    // remove extension
    const parseExtension = (fileName: string) => path.parse(fileName).name;

    return fs
      .readdirSync(`${__dirname}/${pathname}/`)
      .filter((item) => !/(^|\/)\.[^\/\.]/g.test(item))
      .map((fileName) => parseExtension(fileName));
};

const layers: Layer[] = [
    {
        name: "body",
        location: `${__dirname}/body/`,
        elements: getAllElements("body"),
    },
    {
        name: "skin",
        location: `${__dirname}/skin/`,
        elements: getAllElements("skin"),
    },
    {
        name: "head",
        location: `${__dirname}/head/`,
        elements: getAllElements("head"),
    },
    {
        name: "lhand",
        location: `${__dirname}/lhand/`,
        elements: getAllElements("lhand"),
    },
    {
        name: "rhand",
        location: `${__dirname}/rhand/`,
        elements: getAllElements("rhand"),
    }
];

export {
    layers,
    Layer,
    width, 
    height
}