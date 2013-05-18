﻿using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Threading;
using System.Web.Routing;
using EmitRLib.Plugins;

namespace EmitR.Example.Plugin.FileChange
{
    public class Global : System.Web.HttpApplication
    {
        static public string AssemblyDirectory
        {
            get
            {
                string codeBase = Assembly.GetExecutingAssembly().CodeBase;
                UriBuilder uri = new UriBuilder(codeBase);
                string path = Uri.UnescapeDataString(uri.Path);
                return Path.GetDirectoryName(path);
            }
        }

        protected void Application_Start(object sender, EventArgs e)
        {
            RouteTable.Routes.MapHubs();
            var filePath = Path.GetFullPath(Path.Combine(AssemblyDirectory, "../Scripts/ChangeMe.js"));
            EmitRLib.Plugins.FileChange.Watch(new List<string> { filePath });

            BackgroundWorker bw = new BackgroundWorker();
            bw.DoWork += (a, r) =>
            {
                var  counter = 1;
                while (true)
                {
                    var changemejs = "$(\"#fileChange\").append(\"I'm ChangeMe.js version " + counter++ + ".0 <br/>\")";

                    StreamWriter file = new System.IO.StreamWriter(r.Argument as string);
                    file.WriteLine(changemejs);
                    file.Close();                    
                    Thread.Sleep(5000);
                }
            };

            bw.RunWorkerAsync(filePath);
        }
    }
}