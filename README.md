# On Repeat bot

(a.k.a this month in music)

This is a nice little AWS Lambda function to gather all the tracks in my On Repeat Spotify playlist and send them through email. We're using:

- Spotify's API to get the contents of the On Repeat playlist (which is public so we can use client credentials for the authentication). No libraries, only HTTP calls
- Mustache as a templating library to generate the email body (since it is very simple and has no dependencies)
- AWS Simple Email Service to send the actual email (once a month to one recipient does not cost anything... I think 😅), through the AWS Node.js SDK

That's it, basically :)
