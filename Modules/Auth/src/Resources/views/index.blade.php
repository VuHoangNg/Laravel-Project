<!DOCTYPE html>
<html>
<head>
    <title>React Example</title>
    <link rel="stylesheet" href="{{ mix('css/app.css') }}">
</head>
<body>
    <div id="app"></div>
    @viteReactRefresh
    @vite('Modules/Auth/src/Resources/assets/js/app.jsx')
</body>
</html>