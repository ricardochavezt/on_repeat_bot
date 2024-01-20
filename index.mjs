import Mustache from 'mustache'
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses"
const sesClient = new SESClient({ region: "us-east-1" })

const createSendEmailCommand = (toAddress, fromAddress, subject, htmlBody, textBody) => {
    return new SendEmailCommand({
        Source: fromAddress,
        Destination: {
            ToAddresses: [toAddress]
        },
        Message: {
            Subject: {
                Charset:  "UTF-8",
                Data: subject
            },
            Body: {
                Html: {
                    Charset: "UTF-8",
                    Data: htmlBody
                },
                Text: {
                    Charset: "UTF-8",
                    Data: textBody
                }
            }
        }
    })
}

export const handler = async (event) => {
    const authParams = new URLSearchParams()
    authParams.append("grant_type", "client_credentials")
    authParams.append("client_id", process.env["SPOTIFY_CLIENT_ID"])
    authParams.append("client_secret", process.env["SPOTIFY_CLIENT_SECRET"])

    const authResponse = await fetch("https://accounts.spotify.com/api/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: authParams
    })
    const authTokenInfo = await authResponse.json()

    const playlistQueryParams = new URLSearchParams({
        fields: "tracks.items(track(name,artists(name)))"
    })
    const playlistURL = `https://api.spotify.com/v1/playlists/${process.env["SPOTIFY_PLAYLIST_ID"]}?${playlistQueryParams}`
    const playlistResponse = await fetch(playlistURL, {
        headers: {
            "Authorization": `Bearer ${authTokenInfo.access_token}`
        }
    })
    const playlistInfo = await playlistResponse.json()
    const tracks = playlistInfo.tracks.items.map(t => {
        return {
            name: t.track.name,
            artist: t.track.artists.map(a => a.name).join(", ")
        }
    });
    const htmlTemplate = `<p>Hola! Estas son las canciones que m&aacute;s has escuchado este mes.</p>
<p><strong>On Repeat this month:</strong>
<ol>
    {{#tracks}}
    <li>{{name}} - {{artist}}</li>
    {{/tracks}}
</ol>
</p>
<p>Nos vemos</p>
<p>-- musicbot 🤖</p>`
    const textTemplate = `Hola! Estas son las canciones que m&aacute;s has escuchado este mes.

On Repeat this month:
    {{#tracks}}
    - {{name}} - {{artist}}
    {{/tracks}}

Nos vemos

-- musicbot *[º-º]*`

    const sendEmailCommand = createSendEmailCommand(process.env["EMAIL_TO_ADDRESS"], process.env["EMAIL_FROM_ADDRESS"],
        "this month in music", Mustache.render(htmlTemplate, {tracks}), Mustache.render(textTemplate, {tracks}))

    try {
        return await sesClient.send(sendEmailCommand)
    } catch (e) {
        console.error("Error sending email:", e)
        return e
    }
};
