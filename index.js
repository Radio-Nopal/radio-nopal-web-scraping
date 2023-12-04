const axios = require("axios");
const cheerio = require("cheerio");
const { createClient } = require("@sanity/client");
const createSlug = require("./createSlug");
const extractUsernameAndPlatform = require("./extractUsernameAndPlatform");
const findPeriodicidadAndDay = require("./findPeriodicidadAndDay");

function isValidImageURL(url) {
  const imageExtensionsRegex = /\.(jpg|jpeg|svg|png|gif|tiff)/i;
  return imageExtensionsRegex.test(url);
}

const client = createClient({
  projectId: "projectId",
  dataset: "production",
  token:
    "token", // we need this to get write access
  useCdn: false, // We can't use the CDN for writing
  apiVersion: "2021-08-31",
});

const sleep = (ms = 20000) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchProgramas = async () => {
  const url = "https://radionopal.com/";
  // const url = "https://radionopal.com/archivo/";
  const response = await axios.get(url);

  const html = response.data;
  let $ = cheerio.load(html);

  const linksDetallesDePrograma = [];
  $("a.postblock").each((index, item) => {
    const link = $(item).attr("href");

    const imagenPrograma = $(".postimage img", item).attr("src");

    linksDetallesDePrograma.push({ link, imagenPrograma });
  });

  let transaction = client.transaction();

  const slugsPersonas = [];
  // cada programa
  try {
    for (const { link, imagenPrograma } of linksDetallesDePrograma.slice(
      0,
      100,
    )) {
      const detallePrograma = await axios.get(link);
      await sleep();
      $ = cheerio.load(detallePrograma.data);

      const locutorxs = [];

      const personas = $(".entry-content:not(.radio) ");
      // cada persona
      for (const item of personas) {
        const nombre = $(".autor-text h1", item).text();
        const biografia = $(".autor-text p", item).text();
        const slug = createSlug(nombre);
        slugsPersonas.push(slug);
        let mediosDeContacto = [];
        $(".autor-links a", item).each((index, value) => {
          const autorLink = $(value).attr("href");
          const link = extractUsernameAndPlatform(autorLink);
          if (link) {
            mediosDeContacto.push(link);
          }
        });

        const imageUrl = $(".programa-autor-image img", item).attr("src");
        console.log(imageUrl);
        let fotos;
        if (imageUrl && isValidImageURL(imageUrl)) {
          try {
            const bufferResponse = await axios.get(imageUrl, {
              responseType: "arraybuffer",
            });

            const buffer = Buffer.from(bufferResponse.data, "utf-8");

            const imageAsset = await client.assets.upload("image", buffer);

            fotos = [
              {
                _key: `${createSlug(nombre)}-imagen-key`,
                _type: "imagen",
                alt: nombre,
                imagen: {
                  _type: "image",
                  asset: {
                    _type: "reference",
                    _ref: imageAsset._id,
                  },
                },
              },
            ];
          } catch (e) {
            console.log(e);
          }
        }

        await sleep();
        const data = {
          _id: slug,
          _type: "persona",
          fotos,
          nombre,
          slug: { _type: "slug", current: slug },
          biografia: [
            {
              _key: `${slug}-bio-key`,
              _type: "block",
              children: [
                {
                  _key: `${slug}-bio-span-key`,
                  _type: "span",
                  marks: [],
                  text: biografia,
                },
              ],
              markDefs: [],
              style: "normal",
            },
          ],
          mediosDeContacto: mediosDeContacto.length
            ? mediosDeContacto
            : undefined,
        };

        transaction.createOrReplace(data);

        locutorxs.push({
          _key: `${slug}-locutorxs-reference-key`,
          _type: "reference",
          _ref: slug,
        });
      }

      const titulo = $(".titulo-programa h1").text();

      console.log("----" + titulo + "----" + new Date().toLocaleString());

      const slug = createSlug(titulo);
      const fechasLegacy = $("p.fechas").text();

      const descripcion = $(".content-programa p").text();

      const { periodicidad, dias } = findPeriodicidadAndDay(fechasLegacy);

      let imagenes;
      console.log(imagenPrograma);
      if (imagenPrograma && isValidImageURL(imagenPrograma)) {
        const bufferResponse = await axios.get(imagenPrograma, {
          responseType: "arraybuffer",
        });
        await sleep();
        const buffer = Buffer.from(bufferResponse.data, "utf-8");

        const imageAsset = await client.assets.upload("image", buffer);
        imagenes = [
          {
            _key: `${slug}-imagen-programa-key`,
            _type: "imagen",
            alt: titulo,
            imagen: {
              _type: "image",
              asset: {
                _type: "reference",
                _ref: imageAsset._id,
              },
            },
          },
        ];
      }
      const mixcloudIframeLinks = [];
      // cada link de mixcloud
      $(".entry-content.radio iframe")?.each((index, item) => {
        const mixcloudLink = $(item).attr("src");
        mixcloudIframeLinks.push(mixcloudLink);
      });

      const dataPrograma = {
        _type: "programa",
        _id: slug,
        slug: { _type: "slug", current: slug },
        titulo,
        mixcloudIframeLinks,
        descripcionDePrograma: [
          {
            _key: `${slug}-descripcion-programa-key`,
            _type: "block",
            children: [
              {
                _key: `${slug}-descripcion-programa-children-key`,
                _type: "span",
                marks: [],
                text: descripcion,
              },
            ],
            markDefs: [],
            style: "normal",
          },
        ],
        fechasLegacy,
        dias,
        periodicidad,
        archivoMixcloud: [
          {
            _key: `${createSlug(titulo)}-archivo-mixcloud-key`,
            _type: "mixcloudLink",
            link: `https://www.mixcloud.com/radionopal/playlists/${slug}`,
          },
        ],
        imagenes,

        locutorxs,

        archivado: false,
      };

      transaction.createOrReplace(dataPrograma);
      await sleep();
      console.log(
        "--termina--" + titulo + "----" + new Date().toLocaleString(),
      );
    }
  } catch (e) {
    console.log(e);
  }
  const commitResponse = await transaction.commit();
  console.log(commitResponse);
  console.log("☻ ☻ ☻ termina ☻ ☻ ☻");
  return;
};

fetchProgramas();
