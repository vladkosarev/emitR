using Microsoft.AspNet.SignalR;

namespace EmitR
{
    public static class EmitR
    {
        public static void Emit(string type, params object[] args)
        {
            var context = GlobalHost.ConnectionManager.GetHubContext<EmitRHub>();
            context.Clients.Group(type).emit(type, args);
        }
    }
}
