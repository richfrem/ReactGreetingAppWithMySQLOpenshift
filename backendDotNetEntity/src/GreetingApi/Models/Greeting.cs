using System.ComponentModel.DataAnnotations.Schema;

namespace GreetingApi.Models;

public class Greeting
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    [Column("greeting")]
    public string Message { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}