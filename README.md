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
## LICENSE
[MIT License](https://github.com/vladkosarev/emitR/blob/master/LICENSE.md)
