# Media

Drop videos, screenshots and photos here, then point to them from
`content/projects.js`.

Naming that keeps things findable:

    <project-id>-1.mp4
    <project-id>-2.jpg

e.g. `tello-person-following-1.mp4`, `aruco-indoor-mapping-2.jpg`

Then in `content/projects.js`, set the matching slot's `src`:

```js
{ type: "video", src: "assets/media/tello-person-following-1.mp4",
  caption: "Flight clip: the drone holding a person in frame." }
```

Any slot with an empty `src` renders as a labelled empty frame on the site,
with the filename it's expecting — so you can see where media is still missing.

## Before you add anything

- No shots that show your house's interior layout, address, street, or
  anything identifying where you live.
- No school name or uniform in frame.
- If someone else is in the video, ask them first.

## Keeping files small

Clips above ~20 MB make the page slow. Trim and compress with ffmpeg:

    ffmpeg -i raw.mp4 -t 20 -vf scale=1280:-2 -crf 28 -an tello-person-following-1.mp4
