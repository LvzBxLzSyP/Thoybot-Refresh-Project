const Backend = require("i18next-fs-backend");
const i18next = require("i18next");
const path = require("path");

i18next
    .use(Backend)
    .init({
        lng: 'zh-TW',
        fallbackLng: 'en-US',
        ns: ['name'],
        defaultNS: 'name',
        backend: {
            loadPath: path.join(__dirname, '/../locales/{{lng}}/{{ns}}.json'),
        },
        debug: true,
    })

/**
 * Retrieves a localized translation string using a fixed language and namespace context.
 *
 * This function does **not** change the global language state in i18next,
 * making it safe to use during command registration or other synchronous operations.
 *
 * @param {string} key - The translation key to lookup (e.g., 'addcron').
 * @param {string} lang - The language code to use (e.g., 'zh-TW', 'en').
 * @param {string} ns - The namespace containing the key (e.g., 'name', 'description').
 * @returns {string} The localized string, or the key itself if no translation was found.
 *
 * @example
 * const nameZh = translate('addcron', 'zh-TW', 'name');
 * const descEn = translate('addcron', 'en', 'description');
 */
const translate = (key, lang, ns) => {
    return i18next.getFixedT(lang, ns)(key);
}

module.exports = translate;