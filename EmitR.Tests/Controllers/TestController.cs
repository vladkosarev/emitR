using System.Linq;
using System.Web.Http;
using Newtonsoft.Json.Linq;

namespace EmitR.Tests.Controllers
{
    public class TestController : ApiController
    {
        [HttpPost]
        public void TriggerEmit(JObject json)
        {
            EmitR.Emit(json["type"].Value<string>(), json["args"] != null ? json["args"].Select(jv => (object)jv).ToArray() : null);
        }
    }
}
