using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Web.Routing;
using Microsoft.Web.Infrastructure.DynamicModuleHelper;

namespace EmitRLib
{
    public class Startup
    {
        public static void Start()
        {
            //RouteTable.Routes.MapHubs();
            RouteTable.Routes.MapConnection<EmitREndPoint>("emitr", "/emitr");
        }
    }
} 
