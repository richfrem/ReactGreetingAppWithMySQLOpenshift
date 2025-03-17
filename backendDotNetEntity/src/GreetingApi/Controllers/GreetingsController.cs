using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using GreetingApi.Data;
using GreetingApi.Models;

namespace GreetingApi.Controllers;

[ApiController]
[Route("api/[controller]")]
public class GreetingsController : ControllerBase
{
    private readonly GreetingDbContext _context;

    public GreetingsController(GreetingDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Greeting>>> GetGreetings()
    {
        return await _context.Greetings
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();
    }

    [HttpPost]
    public async Task<ActionResult<Greeting>> PostGreeting(Greeting greeting)
    {
        _context.Greetings.Add(greeting);
        await _context.SaveChangesAsync();

        return CreatedAtAction(
            nameof(GetGreetings),
            new { id = greeting.Id },
            greeting);
    }
}