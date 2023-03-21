const axios = require('axios');

// The bypass token should be a build-time randomly generated string of at least 32 characters.
// This value should only be exposed in the function config and inside of the function itself.
// DO NOT expose this value on the client-side: a malicious user could trigger boundless revalidations.
// const bypassToken = '87734ad8259d67c3c11747d3e4e112d0';

const token = process.env.MY_REVALIDATE_TOKEN;
let protocol = 'http://';
const hostname = `${process.env.F_HOSTNAME}:${process.env.F_PORT}`;
if (process.env.NODE_ENV === 'production') protocol = 'https://';

// module.exports = (
//   revalidatePage,
//   pageId = null,
//   userSlug = null,
//   action = null
// ) => {
//   if (pageId && action !== 'create') {
//     console.log(
//       `Revalidated: ${protocol}${hostname}/api/revalidate?page=${revalidatePage}&id=${pageId}&secret=${token}`
//     );
//     axios.get(
//       `${protocol}${hostname}/api/revalidate?page=${revalidatePage}&id=${pageId}&secret=${token}`
//     );
//   }

//   if (revalidatePage === 'artworks') {
//     console.log(
//       `Revalidated: ${protocol}${hostname}/api/revalidate?page=portfolios&id=${userSlug}&secret=${token}`
//     );
//     axios.get(
//       `${protocol}${hostname}/api/revalidate?page=portfolios&id=${userSlug}&secret=${token}`
//     );
//   }
// };

exports.revalidatePortfolioPage = slug => {
  console.log(
    `Revalidated: ${protocol}${hostname}/api/revalidate?page=portfolios&id=${slug}&secret=${token}`
  );
  axios.get(
    `${protocol}${hostname}/api/revalidate?page=portfolios&id=${slug}&secret=${token}`
  );
};

exports.revalidateArtworkPage = hash => {
  console.log(
    `Revalidated: ${protocol}${hostname}/api/revalidate?page=artworks&id=${hash}&secret=${token}`
  );
  axios.get(
    `${protocol}${hostname}/api/revalidate?page=artworks&id=${hash}&secret=${token}`
  );
};
