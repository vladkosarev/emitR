using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Microsoft.AspNet.SignalR;

namespace EmitRLib
{
    public static class EmitR
    {
        private static readonly ConcurrentDictionary<string, IList<EmitREvent>> Handlers = new ConcurrentDictionary<string, IList<EmitREvent>>();

        public delegate void EmitREvent(string clientId, string type, params object[] args);

        public static void Emit(string type, params object[] args)
        {
            var context = GlobalHost.ConnectionManager.GetHubContext<EmitRHub>();
            context.Clients.Group(type).emit(type, args);
            FireServerListeners(null, type, args);
        }

        public static void EmitFromClient(string connectionId, string type, params object[] args)
        {
            var context = GlobalHost.ConnectionManager.GetHubContext<EmitRHub>();
            context.Clients.Group(type, connectionId).emit(type, args);
            FireServerListeners(connectionId, type, args);
        }

        private static void FireServerListeners(string connectionId, string type, params object[] args)
        {
            IList<EmitREvent> typeHandlers;
            Handlers.TryGetValue(type, out typeHandlers);

            if (typeHandlers == null) return;

            foreach (var typeHandler in typeHandlers)
            {
                typeHandler(connectionId, type, args);
            }
        }

        public static void On(string type, EmitREvent emitREvent)
        {
            if (Handlers.ContainsKey(type))
            {
                Handlers[type].Add(emitREvent);
            }
            else
            {
                Handlers.TryAdd(type, new List<EmitREvent> { emitREvent });
            }
        }
    }
}
