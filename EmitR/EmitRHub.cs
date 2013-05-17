using Microsoft.AspNet.SignalR;

namespace EmitRLib
{
    public class EmitRHub : Hub
    {
        public void Subscribe(string type)
        {
            Groups.Add(Context.ConnectionId, type);
        }

        public void Unsubscribe(string type)
        {
            Groups.Remove(Context.ConnectionId, type);
        }

        public void Emit(string type, object[] args)
        {
            EmitR.EmitFromClient(Context.ConnectionId, type, args);
        }
    }
}
