using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.IO;
using System.Reflection;
using System.Threading;

namespace EmitR.Example.Plugin.FileChange
{
    public class Global : System.Web.HttpApplication
    {
        static public string AssemblyDirectory
        {
            get
            {
                var codeBase = Assembly.GetExecutingAssembly().CodeBase;
                var uri = new UriBuilder(codeBase);
                var path = Uri.UnescapeDataString(uri.Path);
                return Path.GetDirectoryName(path);
            }
        }

        protected void Application_Start(object sender, EventArgs e)
        {
            // get ChangeMe.js file path and pass it to FileChange Plugin
            var filePath = Path.GetFullPath(Path.Combine(AssemblyDirectory, "../Scripts/ChangeMe.js"));
            EmitRLib.Plugins.FileChange.Watch(new List<string> { filePath });

            // start a worker that updates ChangeMe.js every five seconds
            var bw = new BackgroundWorker();
            bw.DoWork += (a, r) =>
            {
                var  counter = 1;
                while (true)
                {
                    var changemejs = "$(\"#fileChange\").append(\"I'm ChangeMe.js version " + counter++ + ".0 <br/>\")";

                    var file = new StreamWriter(r.Argument as string);
                    file.WriteLine(changemejs);
                    file.Close();                    
                    Thread.Sleep(5000);
                }
            };

            bw.RunWorkerAsync(filePath);
        }
    }
}