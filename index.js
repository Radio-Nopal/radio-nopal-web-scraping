const axios = require("axios");
const cheerio = require("cheerio");
const extractUsernameAndPlatform = require("./extractUsernameAndPlatform");
const findPeriodicidadAndDay = require("./findPeriodicidadAndDay");
const { createSlug, sleep, isValidImageURL } = require("./utils");
const sanityClient = require("./sanityClient");

const fetchProgramas = async (esArchivo) => {
  const url = esArchivo
    ? "https://radionopal.com/archivo/"
    : "https://radionopal.com/";
  const response = await axios.get(url);

  const html = response.data;
  let $ = cheerio.load(html);

  const linksDetallesDePrograma = [];
  $("a.postblock").each((index, item) => {
    const link = $(item).attr("href");

    const imagenPrograma = $(".postimage img", item).attr("src");

    linksDetallesDePrograma.push({ link, imagenPrograma });
  });

  let transaction = sanityClient.transaction();

  const slugsPersonas = [];
  // cada programa
  try {
    for (const { link, imagenPrograma } of linksDetallesDePrograma.slice(
      0,
      300,
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

            const imageAsset = await sanityClient.assets.upload(
              "image",
              buffer,
            );

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
            console.error(e);
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

      console.info("----" + titulo + "----" + new Date().toLocaleString());

      const slug = createSlug(titulo);
      const fechasLegacy = $("p.fechas").text();

      const descripcion = $(".content-programa p").text();

      const { periodicidad, dias } = findPeriodicidadAndDay(fechasLegacy);

      let imagenes;
      console.log(imagenPrograma);
      if (imagenPrograma && isValidImageURL(imagenPrograma)) {
        try {
          const bufferResponse = await axios.get(imagenPrograma, {
            responseType: "arraybuffer",
          });
          await sleep();
          const buffer = Buffer.from(bufferResponse.data, "utf-8");

          const imageAsset = await sanityClient.assets.upload("image", buffer);
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
        } catch (error) {
          console.error("Error fetching image:", error);
        }
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

        archivado: esArchivo,
      };

      transaction.createOrReplace(dataPrograma);
      await sleep();
      console.info(
        "--termina--" + titulo + "----" + new Date().toLocaleString(),
      );
    }
  } catch (e) {
    console.warn(e);
  }
  const commitResponse = await transaction.commit();
  console.info(commitResponse);
  console.info("☻ ☻ ☻ termina ☻ ☻ ☻");
  return;
};

fetchProgramas(false);
