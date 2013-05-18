emitR
=====
Server connected event emitter. Trigger events on the server and respond to them on the client in real-time.
## Getting Started
* Get **emitR** from nuget

  ```
      Install-Package emitR
  ```
* On the client (if you have any of the dependencies already included you don't need to add them, just include emitR.js)

  ```html
      <script type="text/javascript" src="~/Scripts/jquery-1.6.4.js"></script>
      <script type="text/javascript" src="~/Scripts/jquery.signalR-1.0.1.js"></script>
      <script type="text/javascript" src='~/signalr/hubs'></script>
      <script type="text/javascript" src="~/Scripts/emitR.js"></script>
  ```
* On the server

  Add **emitR** using
  ```CSharp
  using EmitRLib;
  ```

You are ready to use **emitR**

```CSharp
EmitR.Emit("alert", "Hello World!");
```

## Mandatory Chat Example

**No server side code!**

Client code -
```html
<html>
<head></head>
    
<body>
    <form id="message">
        <input type="text" id="messageText" value="" /><input type="submit" value="Send" />
    </form>
    <div id="chatWindow"></div>
</body>

<script type="text/javascript" src="/Scripts/jquery-1.6.4.js"></script>
<script type="text/javascript" src="/Scripts/jquery.signalR-1.1.0.js"></script>
<script type="text/javascript" src='/signalr/hubs'></script>
<script type="text/javascript" src="/Scripts/emitR.js"></script>

<script type="text/javascript">
    $(function () {
        emitR.init().done(function () {
            emitR.on("newmessage", function (message) {
                $("#chatWindow").append(message + "<br/>");
            });
			$('#message').submit(function () {
				emitR.emit("newmessage", $(this).find("#messageText").val());
				return false;
			});
        });        
    });
</script>
</html>
```

**That's it!**

## LICENSE
[MIT License](https://github.com/vladkosarev/emitR/blob/master/LICENSE.md)
